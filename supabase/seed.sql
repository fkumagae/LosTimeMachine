-- Apenas para ambientes de teste. Nenhuma conta é criada por este arquivo.
insert into public.participants (id, nome, apelido, bio) values
  ('11111111-1111-4111-8111-111111111111', 'Marina Demo', 'Nina', 'Coleciona histórias da turma.'),
  ('22222222-2222-4222-8222-222222222222', 'Antônio Demo', 'Tico', 'Responsável pelos trocadilhos.')
on conflict (id) do nothing;
