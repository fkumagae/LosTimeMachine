// Regras do ensaio local. O modo conectado aplica as mesmas regras no PostgreSQL.
export function initialEdition(roster) {
  return {
    year: 2026,
    phase: 'aberta',
    revealed: 0,
    memories: roster.photos.map((photo) => ({
      id: photo.id,
      kind: 'foto',
      title: photo.legenda,
      image: photo.url,
      tags: [...photo.participantes],
      year: 2024,
      date: '',
      author: '',
      by: '',
    })),
    categories: roster.categories
      .map((c) => ({
        id: c.id,
        title: c.tipo === 'foto' ? 'Foto do Ano' : c.titulo,
        kind: c.tipo,
        candidates:
          c.tipo === 'pessoa' ? roster.participants.map((p) => p.id) : [],
      }))
      .concat({
        id: 'frase',
        title: 'Frase do Ano',
        kind: 'frase',
        candidates: [],
      }),
    votes: {},
    results: [],
    archive: [],
  };
}

export function credit(category, id, state) {
  if (category.kind === 'pessoa') return id;
  if (category.kind === 'frase')
    return state.memories.find((m) => m.id === id)?.author || '';
  return '';
}

export function submitVote(state, voter, categoryId, candidate) {
  const category = state.categories.find((c) => c.id === categoryId);
  if (state.phase !== 'aberta' || !category?.candidates.includes(candidate))
    throw Error('Escolha indisponível.');
  (state.votes[voter] ||= {})[categoryId] = candidate;
}

export function groups(items) {
  const ordered = items
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);
  const result = [];
  for (const item of ordered) {
    if (result.at(-1)?.[0].count !== item.count) result.push([]);
    result.at(-1).push(item);
  }
  return result;
}

export function closeEdition(state, people) {
  if (state.phase !== 'aberta') throw Error('Votação já encerrada.');
  state.results = state.categories.map((category) => {
    const counts = new Map(category.candidates.map((id) => [id, 0]));
    for (const [voter, ballot] of Object.entries(state.votes)) {
      const id = ballot[category.id];
      if (counts.has(id) && credit(category, id, state) !== voter)
        counts.set(id, counts.get(id) + 1);
    }
    const ranked = groups(
      Array.from(counts, ([id, count]) => {
        const memory = state.memories.find((m) => m.id === id);
        return {
          id,
          count,
          owner: credit(category, id, state),
          label:
            category.kind === 'pessoa'
              ? people.find((p) => p.id === id)?.apelido || id
              : memory?.title || id,
          image: memory?.image || '',
        };
      }),
    ).slice(0, 3);
    return { title: category.title, year: state.year, ranked };
  });
  state.phase = 'fechada';
}

export function trophies(results) {
  const totals = new Map();
  for (const result of results) {
    const owners = new Set(
      (result.ranked[0] || []).map((w) => w.owner).filter(Boolean),
    );
    for (const id of owners) {
      if (!totals.has(id)) totals.set(id, []);
      totals.get(id).push({ year: result.year, title: result.title });
    }
  }
  return groups(
    Array.from(totals, ([id, awards]) => ({
      id,
      awards,
      count: awards.length,
    })),
  );
}
