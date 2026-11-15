'use strict';

// Dados fictícios usados exclusivamente neste protótipo.
const demo = {
  participants: [
    { id: 'nina', nome: 'Marina Demo', apelido: 'Nina', fotos: ['palco', 'brinde'] },
    { id: 'tico', nome: 'Antônio Demo', apelido: 'Tico', fotos: ['palco', 'mesa'] },
    { id: 'lume', nome: 'Luísa Demo', apelido: 'Lume', fotos: ['brinde', 'mesa'] },
    { id: 'duda', nome: 'Eduarda Demo', apelido: 'Duda', fotos: ['mesa'] }
  ],
  photos: [
    { id: 'palco', url: '../assets/palco.jpg', legenda: 'Luzes no palco', participantes: ['nina', 'tico'] },
    { id: 'brinde', url: '../assets/brinde.jpg', legenda: 'Brinde da turma', participantes: ['nina', 'lume'] },
    { id: 'mesa', url: '../assets/mesa.jpg', legenda: 'Mesa do after', participantes: ['tico', 'lume', 'duda'] }
  ],
  edition: { id: 'demo', ano: 2026, titulo: 'Edição demonstrativa' },
  categories: [
    { id: 'historia', titulo: 'Melhor história', tipo: 'pessoa', votos: [8, 5, 5, 2] },
    { id: 'momento', titulo: 'Foto da noite', tipo: 'foto', votos: [7, 4, 2] },
    { id: 'surpresa', titulo: 'Surpresa da noite', tipo: 'pessoa', votos: [0, 0, 0, 0] }
  ],
  historicalYears: [2024, 2025]
};

function nominees(category) {
  if (category.tipo === 'foto') {
    return demo.photos.map(photo => ({ id: photo.id, apelido: photo.legenda, imgs: [photo.url] }));
  }
  return demo.participants.map(person => ({
    id: person.id,
    apelido: person.apelido,
    imgs: person.fotos.map(photoId => demo.photos.find(photo => photo.id === photoId)?.url).filter(Boolean)
  }));
}
