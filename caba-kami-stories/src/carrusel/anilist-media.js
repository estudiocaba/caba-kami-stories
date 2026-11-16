// Busca un anime en AniList y devuelve sus datos y las URLs de sus imágenes oficiales
// (portada y personajes). API pública y gratuita, sin clave.

const ENDPOINT = 'https://graphql.anilist.co';

const QUERY = `
query ($search: String, $id: Int) {
  Page(perPage: 10) {
    media(search: $search, id: $id, type: ANIME, sort: [SEARCH_MATCH]) {
      id
      title { romaji english native }
      season
      seasonYear
      format
      episodes
      duration
      averageScore
      popularity
      favourites
      genres
      siteUrl
      coverImage { extraLarge large color }
      bannerImage
      studios(isMain: true) { nodes { name } }
      characters(sort: [ROLE, RELEVANCE, ID], perPage: 25) {
        nodes { name { full native alternative } image { large } favourites }
      }
    }
  }
}`;

async function gql(variables) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: QUERY, variables }),
  });
  if (!res.ok) throw new Error(`AniList respondió ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.errors) throw new Error('AniList: ' + JSON.stringify(json.errors));
  return json.data.Page.media;
}

// anime: { id } o { busqueda, anio }. Con "anio" se elige la temporada que se estrenó ese año.
export async function fetchAnime(anime) {
  const list = anime.id ? await gql({ id: anime.id }) : await gql({ search: anime.busqueda });
  if (!list.length) throw new Error(`AniList no encontró «${anime.busqueda ?? anime.id}»`);
  let media = list[0];
  if (anime.anio) {
    const sameYear = list.filter(m => m.seasonYear === anime.anio && ['TV', 'TV_SHORT', 'ONA'].includes(m.format));
    if (sameYear.length) media = sameYear[0];
  }
  return media;
}

// Busca un personaje por nombre (completo, de pila o alternativo).
export function findCharacter(media, nombre) {
  const n = nombre.toLowerCase();
  const nodes = media.characters?.nodes ?? [];
  return nodes.find(c =>
    c.name.full?.toLowerCase() === n ||
    c.name.full?.toLowerCase().split(' ').includes(n) ||
    (c.name.alternative ?? []).some(a => a?.toLowerCase() === n),
  ) ?? nodes.find(c => c.name.full?.toLowerCase().includes(n));
}

// Descarga una imagen y la devuelve como data URI para meterla en la plantilla.
export async function imageAsDataUri(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo descargar ${url} (${res.status})`);
  const type = res.headers.get('content-type') || 'image/jpeg';
  const buf = Buffer.from(await res.arrayBuffer());
  return `data:${type};base64,${buf.toString('base64')}`;
}

// Busca un personaje por nombre (con el anime opcional para desambiguar) y devuelve nombre, imagen y favoritos.
const CHAR_QUERY = `
query ($search: String) {
  Page(perPage: 10) {
    characters(search: $search, sort: [SEARCH_MATCH, FAVOURITES_DESC]) {
      name { full native } image { large } favourites
      media(perPage: 5, sort: [POPULARITY_DESC]) { nodes { title { romaji english } type } }
    }
  }
}`;

export async function fetchCharacterByName(nombre, anime) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: CHAR_QUERY, variables: { search: nombre } }),
  });
  if (!res.ok) throw new Error(`AniList respondió ${res.status}`);
  const list = (await res.json()).data?.Page?.characters ?? [];
  if (anime) {
    const a = anime.toLowerCase();
    const hit = list.find(c => c.media.nodes.some(m =>
      [m.title.romaji, m.title.english].some(t => t?.toLowerCase().includes(a))));
    if (hit) return hit;
  }
  return list[0];
}
