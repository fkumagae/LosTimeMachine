begin;
create schema if not exists awards_private;
revoke all on schema awards_private from public, anon, authenticated;
create table awards_private.editions (
  year integer primary key, state jsonb not null
);
create table awards_private.organizers (
  participant_id uuid primary key references public.participants
);
-- Somente resultados históricos já conferidos pelo organizador.
create table awards_private.archive (
  year integer not null, title text not null, ranked jsonb not null, primary key(year,title)
);

create function public.los_edition(action text default 'read', args jsonb default '{}')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  me uuid; organizer boolean; s jsonb; cat jsonb; mem jsonb; person jsonb;
  cats jsonb; results jsonb; ranked jsonb; entry jsonb; completed jsonb;
  ci integer; mi integer; n integer; target text := args->>'id';
begin
  select participant_id into me from public.participant_accounts where user_id=auth.uid();
  if me is null then raise exception 'Conta sem vínculo'; end if;
  select exists(select 1 from awards_private.organizers where participant_id=me) into organizer;
  if action='read' then
    select state into strict s from awards_private.editions where year=2026;
  else
    select state into strict s from awards_private.editions where year=2026 for update;
  end if;
  select value, ord::int-1 into cat,ci from jsonb_array_elements(s->'categories') with ordinality as c(value,ord) where value->>'id'=args->>'category';
  select value, ord::int-1 into mem,mi from jsonb_array_elements(s->'memories') with ordinality as m(value,ord) where value->>'id'=target;
  if action in ('close','reveal','archive') and not organizer then raise exception 'Acesso restrito à organização'; end if;
  if action in ('nominate','vote','close') and s->>'phase'<>'aberta' then raise exception 'Votação encerrada'; end if;
  case action
  when 'read' then null;
  when 'memory' then
    if coalesce(args->>'kind','') not in ('foto','frase','historia') or coalesce(length(trim(args->>'title')),0) not between 1 and 1500
      or jsonb_typeof(args->'tags') is distinct from 'array'
      or coalesce(args->>'year','') !~ '^(19|20)[0-9]{2}$'
      or coalesce(args->>'date','') !~ '^([0-9]{4}-[0-9]{2}(-[0-9]{2})?)?$'
      or (coalesce(args->>'date','') <> '' and left(args->>'date',4)<>args->>'year')
      then raise exception 'Memória inválida'; end if;
    if args->>'kind'='foto' and coalesce(args->>'image','') !~ '^https://lh3[.]googleusercontent[.]com/d/[A-Za-z0-9_-]+$' then raise exception 'Foto inválida'; end if;
    if exists(select 1 from jsonb_array_elements_text(args->'tags') t(id) where not exists(select 1 from public.participants p where p.id::text=t.id))
      or (coalesce(args->>'author','')<>'' and not exists(select 1 from public.participants where id::text=args->>'author'))
      then raise exception 'Participante inválido'; end if;
    entry=jsonb_build_object('id',gen_random_uuid(),'kind',args->>'kind','title',trim(args->>'title'),'image',case when args->>'kind'='foto' then args->>'image' else '' end,'by',me,'author',coalesce(args->>'author',''),'tags',args->'tags','year',(args->>'year')::int,'date',coalesce(args->>'date',''));
    s=jsonb_set(s,'{memories}',(s->'memories')||jsonb_build_array(entry));
  when 'tag' then
    if mem is null or not exists(select 1 from public.participants where id::text=args->>'person') then raise exception 'Marcação inválida'; end if;
    if not (mem->'tags' ? (args->>'person')) then s=jsonb_set(s,array['memories',mi::text,'tags'],(mem->'tags')||jsonb_build_array(args->>'person')); end if;
  when 'nominate' then
    if cat is null or mem is null or cat->>'kind'<>mem->>'kind' then raise exception 'Indicação inválida'; end if;
    if not (cat->'candidates' ? target) then s=jsonb_set(s,array['categories',ci::text,'candidates'],(cat->'candidates')||jsonb_build_array(target)); end if;
  when 'vote' then
    if target is null or cat is null or not (cat->'candidates' ? target) then raise exception 'Candidato inválido'; end if;
    s=jsonb_set(s,array['votes',me::text],coalesce(s->'votes'->me::text,'{}')||jsonb_build_object(cat->>'id',target));
  when 'archive' then
    if coalesce(args->>'year','') not in ('2024','2025')
      or coalesce(length(trim(args->>'title')),0) not between 1 and 120
      or coalesce(length(trim(args->>'label')),0) not between 1 and 300
      or (coalesce(args->>'owner','')<>'' and not exists(select 1 from public.participants p where p.id::text=args->>'owner'))
      then raise exception 'Prêmio inválido'; end if;
    entry=jsonb_build_object('owner',coalesce(args->>'owner',''),'label',trim(args->>'label'));
    insert into awards_private.archive(year,title,ranked)
    values ((args->>'year')::int,trim(args->>'title'),jsonb_build_array(jsonb_build_array(entry)))
    on conflict (year,title) do update set ranked=jsonb_set(awards_private.archive.ranked,'{0}',(awards_private.archive.ranked->0)||jsonb_build_array(entry))
    where not (awards_private.archive.ranked->0 @> jsonb_build_array(entry));
  when 'close' then
    results='[]';
    for cat in select value from jsonb_array_elements(s->'categories') loop
      with candidates as (
        select ids.id, case cat->>'kind' when 'pessoa' then ids.id when 'frase' then nullif(m->>'author','') end as owner,
        coalesce(p.apelido,m->>'title',ids.id) as label,coalesce(m->>'image','') as image
        from jsonb_array_elements_text(cat->'candidates') as ids(id)
        left join public.participants p on p.id::text=ids.id
        left join lateral (select value as m from jsonb_array_elements(s->'memories') where value->>'id'=ids.id) memories on true
      ), counts as (
        select c.*, (select count(*) from jsonb_each(s->'votes') b where b.value->>(cat->>'id')=c.id and b.key is distinct from c.owner) as count from candidates c
      ), positions as (
        select *,dense_rank() over(order by count desc) as pos from counts where count>0
      ), podium as (
        select pos,jsonb_agg(to_jsonb(positions)-'pos' order by id) as items from positions where pos<=3 group by pos
      ) select coalesce(jsonb_agg(items order by pos),'[]') into ranked from podium;
      results=results||jsonb_build_array(jsonb_build_object('year',2026,'title',cat->>'title','ranked',ranked));
    end loop;
    s=s||jsonb_build_object('results',results,'phase','fechada');
  when 'reveal' then
    n=(s->>'revealed')::int;
    if s->>'phase'<>'fechada' or n is distinct from (args->>'index')::int or n>=jsonb_array_length(s->'results') then raise exception 'Revelação indisponível'; end if;
    s=jsonb_set(s,'{revealed}',to_jsonb(n+1));
  else raise exception 'Ação desconhecida';
  end case;
  if action<>'read' then update awards_private.editions set state=s where year=2026; end if;
  select coalesce(jsonb_agg(p.id),'[]') into completed from public.participants p
    where exists(select 1 from jsonb_array_elements(s->'categories') c where jsonb_array_length(c->'candidates')>0)
    and not exists(select 1 from jsonb_array_elements(s->'categories') c where jsonb_array_length(c->'candidates')>0 and not(coalesce(s->'votes'->p.id::text,'{}') ? (c->>'id')));
  return (s-'votes'-'results')||jsonb_build_object('me',me,'admin',organizer,'done',completed,
    'ballot',coalesce(s->'votes'->me::text,'{}'),
    'results',(select coalesce(jsonb_agg(value order by ord),'[]') from jsonb_array_elements(s->'results') with ordinality r(value,ord) where ord<=(s->>'revealed')::int),
    'archive',(select coalesce(jsonb_agg(to_jsonb(a) order by year,title),'[]') from awards_private.archive a));
end;
$$;
revoke all on function public.los_edition(text,jsonb) from public, anon;
grant execute on function public.los_edition(text,jsonb) to authenticated;
commit;
