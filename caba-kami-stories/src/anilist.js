// Consulta a AniList (API GraphQL pública y gratuita, sin clave).
// Devuelve los episodios que se emiten en Japón durante el día indicado,
// con el día calculado en la zona horaria de la cuenta.

const ENDPOINT = 'https://graphql.anilist.co';

const QUERY = `
query ($start: Int, $end: Int, $page: Int) {
  Page(page: $page, perPage: 50) {
    pageInfo { hasNextPage }
    airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
      airingAt
      episode
      media {
        id
        title { romaji english }
        popularity
        isAdult
        countryOfOrigin
        format
        episodes
        siteUrl
        externalLinks { site type isDisabled language }
      }
    }
  }
}`;

// Inicio y fin (en segundos UNIX) del día `ymd` (YYYY-MM-DD) en la zona `tz`.
export function dayBounds(ymd, tz) {
  const [y, m, d] = ymd.split('-').map(Number);
  const guess = Date.UTC(y, m - 1, d, 0, 0, 0);
  const offset = tzOffsetMs(guess, tz);
  const start = guess - offset;
  const end = start + 24 * 3600 * 1000;
  return { start: Math.floor(start / 1000), end: Math.floor(end / 1000) };
}

function tzOffsetMs(utcMs, tz) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - utcMs;
}

export function todayIn(tz) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
}

export async function fetchAiring(ymd, config) {
  const { start, end } = dayBounds(ymd, config.timezone);
  const all = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { start: start - 1, end, page } }),
    });
    if (!res.ok) throw new Error(`AniList respondió ${res.status}: ${await res.text()}`);
    const json = await res.json();
    if (json.errors) throw new Error('AniList: ' + JSON.stringify(json.errors));
    const data = json.data.Page;
    all.push(...data.airingSchedules);
    if (!data.pageInfo.hasNextPage) break;
  }
  return selectItems(all, config);
}

// Filtra, ordena por popularidad, se queda con los N primeros y los vuelve a ordenar por hora.
export function selectItems(schedules, config) {
  const seen = new Set();
  return schedules
    .filter(s => s.media && !s.media.isAdult)
    .filter(s => !config.countries?.length || config.countries.includes(s.media.countryOfOrigin))
    .filter(s => !config.formats?.length || config.formats.includes(s.media.format))
    .filter(s => (s.media.popularity ?? 0) >= (config.minPopularity ?? 0))
    .sort((a, b) => (b.media.popularity ?? 0) - (a.media.popularity ?? 0))
    .filter(s => (seen.has(s.media.id) ? false : seen.add(s.media.id)))
    .slice(0, config.maxItems ?? 7)
    .sort((a, b) => a.airingAt - b.airingAt)
    .map(s => ({
      title: s.media.title.romaji || s.media.title.english,
      titleEnglish: secondTitle(s.media.title),
      episode: s.episode,
      totalEpisodes: s.media.episodes,
      airingAt: s.airingAt,
      url: s.media.siteUrl,
      platforms: streamingPlatforms(s.media.externalLinks, config),
      tag: s.episode === 1 ? 'ESTRENO' : (s.media.episodes && s.episode === s.media.episodes ? 'FINAL' : null),
    }));
}

// Título en inglés solo si existe y no es igual al romaji.
function secondTitle(t) {
  if (!t.romaji || !t.english) return null;
  const norm = x => x.toLowerCase().replace(/[^a-z0-9]/g, '');
  return norm(t.romaji) === norm(t.english) ? null : t.english;
}

// Plataformas de streaming según AniList, solo las de la lista de config.json (las que existen en España).
// Se descartan los enlaces marcados para un idioma que no sea inglés o español (p. ej. Netflix Japón).
function streamingPlatforms(links = [], config) {
  const allowed = config.platforms ?? {};
  const okLang = l => !l || ['English', 'Spanish'].includes(l);
  const labels = (links ?? [])
    .filter(l => l.type === 'STREAMING' && !l.isDisabled && okLang(l.language) && allowed[l.site])
    .map(l => allowed[l.site]);
  const order = Object.values(allowed);
  return [...new Set(labels)].sort((a, b) => order.indexOf(a) - order.indexOf(b)).slice(0, 3);
}
