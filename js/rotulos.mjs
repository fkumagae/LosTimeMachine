// Os rótulos são texto simples. A interface escapa o texto ao montar o HTML.
function phraseLabel(text, author, nick) {
  return text + ' · ' + (author ? 'Autoria: ' + (nick(author) || author) : 'Sem autor explícito');
}

export function memoryLabel(memory, nick) {
  if (memory?.kind === 'frase') return phraseLabel(memory.title, memory.author, nick);
  return memory?.title || '';
}

export function resultLabel(entry, memories, nick) {
  const memory = memories.find((m) => m.id === entry.id);
  if (memory?.kind === 'frase') return phraseLabel(entry.label, entry.owner, nick);
  return entry.label;
}
