
-- =====================================================================
-- CRM de Obras — núcleo inicial
-- =====================================================================

-- Enums
do $$ begin
  create type public.crm_obra_status as enum ('planejamento','em_andamento','pausada','concluida','cancelada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_item_tipo as enum ('servico','materia_prima');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_item_status as enum ('definido','planejado','concluido');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_recebivel_status as enum ('previsto','faturado','recebido','cancelado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.crm_membro_papel as enum ('coordenador','colaborador','cliente');
exception when duplicate_object then null; end $$;

-- =====================================================================
-- Tabelas
-- =====================================================================

create table if not exists public.crm_obras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  cliente_nome text,
  cliente_email text,
  escopo text,
  endereco text,
  status public.crm_obra_status not null default 'planejamento',
  data_inicio_prevista date,
  data_fim_prevista date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_obra_financeiro (
  obra_id uuid primary key references public.crm_obras(id) on delete cascade,
  valor_contrato numeric(14,2) not null default 0,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_obra_membros (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.crm_obras(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  papel public.crm_membro_papel not null,
  can_view_financial boolean not null default false,
  created_at timestamptz not null default now(),
  unique (obra_id, user_id)
);
create index if not exists crm_obra_membros_user_idx on public.crm_obra_membros(user_id);
create index if not exists crm_obra_membros_obra_idx on public.crm_obra_membros(obra_id);

create table if not exists public.crm_projetos (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.crm_obras(id) on delete cascade,
  nome text not null,
  escopo text,
  descricao text,
  status public.crm_obra_status not null default 'planejamento',
  ordem int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crm_projetos_obra_idx on public.crm_projetos(obra_id);

create table if not exists public.crm_fase_templates (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  is_global boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_fase_template_itens (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.crm_fase_templates(id) on delete cascade,
  nome text not null,
  descricao text,
  ordem int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists crm_fase_template_itens_tpl_idx on public.crm_fase_template_itens(template_id);

create table if not exists public.crm_fases (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.crm_projetos(id) on delete cascade,
  template_id uuid references public.crm_fase_templates(id) on delete set null,
  nome text not null,
  descricao text,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crm_fases_projeto_idx on public.crm_fases(projeto_id);

create table if not exists public.crm_planejamento_itens (
  id uuid primary key default gen_random_uuid(),
  projeto_id uuid not null references public.crm_projetos(id) on delete cascade,
  fase_id uuid references public.crm_fases(id) on delete set null,
  tipo public.crm_item_tipo not null,
  nome text not null,
  descricao text,
  unidade text,
  quantidade numeric(14,2) not null default 1,
  equipe text,
  responsavel_user_id uuid references auth.users(id) on delete set null,
  servico_relacionado_id uuid references public.crm_planejamento_itens(id) on delete set null,
  data_inicio date,
  data_fim date,
  completed_at timestamptz,
  status public.crm_item_status not null default 'definido',
  ordem int not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crm_itens_projeto_idx on public.crm_planejamento_itens(projeto_id);
create index if not exists crm_itens_fase_idx on public.crm_planejamento_itens(fase_id);
create index if not exists crm_itens_status_idx on public.crm_planejamento_itens(status);

create table if not exists public.crm_item_custos (
  item_id uuid primary key references public.crm_planejamento_itens(id) on delete cascade,
  custo_previsto numeric(14,2) not null default 0,
  custo_real numeric(14,2),
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_recebiveis (
  id uuid primary key default gen_random_uuid(),
  obra_id uuid not null references public.crm_obras(id) on delete cascade,
  descricao text not null,
  valor numeric(14,2) not null default 0,
  data_prevista date,
  data_recebimento date,
  status public.crm_recebivel_status not null default 'previsto',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists crm_recebiveis_obra_idx on public.crm_recebiveis(obra_id);

create table if not exists public.crm_audit_log (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  user_id uuid,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Funções auxiliares (SECURITY DEFINER) para evitar recursão em RLS
-- =====================================================================

create or replace function public.is_crm_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.has_role(auth.uid(), 'admin'::public.app_role)
$$;

create or replace function public.is_obra_member(_obra_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or exists (
      select 1 from public.crm_obra_membros m
      where m.obra_id = _obra_id and m.user_id = auth.uid()
    )
$$;

create or replace function public.is_obra_coordenador(_obra_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or exists (
      select 1 from public.crm_obra_membros m
      where m.obra_id = _obra_id and m.user_id = auth.uid() and m.papel = 'coordenador'
    )
$$;

create or replace function public.can_view_obra_financial(_obra_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    public.has_role(auth.uid(), 'admin'::public.app_role)
    or exists (
      select 1 from public.crm_obra_membros m
      where m.obra_id = _obra_id and m.user_id = auth.uid() and m.can_view_financial = true
    )
$$;

create or replace function public.obra_id_of_projeto(_projeto_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select obra_id from public.crm_projetos where id = _projeto_id
$$;

create or replace function public.obra_id_of_item(_item_id uuid)
returns uuid
language sql stable security definer set search_path = public
as $$
  select p.obra_id
  from public.crm_planejamento_itens i
  join public.crm_projetos p on p.id = i.projeto_id
  where i.id = _item_id
$$;

-- =====================================================================
-- Triggers
-- =====================================================================

-- updated_at
create trigger crm_obras_set_updated_at before update on public.crm_obras
  for each row execute function public.set_updated_at();
create trigger crm_obra_financeiro_set_updated_at before update on public.crm_obra_financeiro
  for each row execute function public.set_updated_at();
create trigger crm_projetos_set_updated_at before update on public.crm_projetos
  for each row execute function public.set_updated_at();
create trigger crm_fase_templates_set_updated_at before update on public.crm_fase_templates
  for each row execute function public.set_updated_at();
create trigger crm_fases_set_updated_at before update on public.crm_fases
  for each row execute function public.set_updated_at();
create trigger crm_planejamento_itens_set_updated_at before update on public.crm_planejamento_itens
  for each row execute function public.set_updated_at();
create trigger crm_item_custos_set_updated_at before update on public.crm_item_custos
  for each row execute function public.set_updated_at();
create trigger crm_recebiveis_set_updated_at before update on public.crm_recebiveis
  for each row execute function public.set_updated_at();

-- Recálculo automático do status do item
create or replace function public.crm_recalc_item_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.completed_at is not null then
    new.status := 'concluido';
  elsif new.data_inicio is not null or new.data_fim is not null then
    new.status := 'planejado';
  else
    new.status := 'definido';
  end if;
  return new;
end;
$$;

create trigger crm_itens_recalc_status
  before insert or update on public.crm_planejamento_itens
  for each row execute function public.crm_recalc_item_status();

-- =====================================================================
-- RLS
-- =====================================================================

alter table public.crm_obras                 enable row level security;
alter table public.crm_obra_financeiro       enable row level security;
alter table public.crm_obra_membros          enable row level security;
alter table public.crm_projetos              enable row level security;
alter table public.crm_fase_templates        enable row level security;
alter table public.crm_fase_template_itens   enable row level security;
alter table public.crm_fases                 enable row level security;
alter table public.crm_planejamento_itens    enable row level security;
alter table public.crm_item_custos           enable row level security;
alter table public.crm_recebiveis            enable row level security;
alter table public.crm_audit_log             enable row level security;

-- crm_obras
create policy "obras: members read"
  on public.crm_obras for select to authenticated
  using (public.is_obra_member(id));
create policy "obras: admin insert"
  on public.crm_obras for insert to authenticated
  with check (public.is_crm_admin());
create policy "obras: admin/coord update"
  on public.crm_obras for update to authenticated
  using (public.is_obra_coordenador(id))
  with check (public.is_obra_coordenador(id));
create policy "obras: admin delete"
  on public.crm_obras for delete to authenticated
  using (public.is_crm_admin());

-- crm_obra_financeiro
create policy "fin_obra: financial read"
  on public.crm_obra_financeiro for select to authenticated
  using (public.can_view_obra_financial(obra_id));
create policy "fin_obra: financial insert"
  on public.crm_obra_financeiro for insert to authenticated
  with check (public.can_view_obra_financial(obra_id));
create policy "fin_obra: financial update"
  on public.crm_obra_financeiro for update to authenticated
  using (public.can_view_obra_financial(obra_id))
  with check (public.can_view_obra_financial(obra_id));
create policy "fin_obra: admin delete"
  on public.crm_obra_financeiro for delete to authenticated
  using (public.is_crm_admin());

-- crm_obra_membros
create policy "membros: members read"
  on public.crm_obra_membros for select to authenticated
  using (public.is_obra_member(obra_id) or user_id = auth.uid());
create policy "membros: admin manage all"
  on public.crm_obra_membros for all to authenticated
  using (public.is_crm_admin())
  with check (public.is_crm_admin());

-- crm_projetos
create policy "projetos: members read"
  on public.crm_projetos for select to authenticated
  using (public.is_obra_member(obra_id));
create policy "projetos: coord insert"
  on public.crm_projetos for insert to authenticated
  with check (public.is_obra_coordenador(obra_id));
create policy "projetos: coord update"
  on public.crm_projetos for update to authenticated
  using (public.is_obra_coordenador(obra_id))
  with check (public.is_obra_coordenador(obra_id));
create policy "projetos: coord delete"
  on public.crm_projetos for delete to authenticated
  using (public.is_obra_coordenador(obra_id));

-- crm_fases
create policy "fases: members read"
  on public.crm_fases for select to authenticated
  using (public.is_obra_member(public.obra_id_of_projeto(projeto_id)));
create policy "fases: coord write"
  on public.crm_fases for all to authenticated
  using (public.is_obra_coordenador(public.obra_id_of_projeto(projeto_id)))
  with check (public.is_obra_coordenador(public.obra_id_of_projeto(projeto_id)));

-- crm_planejamento_itens
create policy "itens: members read"
  on public.crm_planejamento_itens for select to authenticated
  using (public.is_obra_member(public.obra_id_of_projeto(projeto_id)));
create policy "itens: coord write"
  on public.crm_planejamento_itens for all to authenticated
  using (public.is_obra_coordenador(public.obra_id_of_projeto(projeto_id)))
  with check (public.is_obra_coordenador(public.obra_id_of_projeto(projeto_id)));

-- crm_item_custos
create policy "custos: financial read"
  on public.crm_item_custos for select to authenticated
  using (public.can_view_obra_financial(public.obra_id_of_item(item_id)));
create policy "custos: financial write"
  on public.crm_item_custos for all to authenticated
  using (public.can_view_obra_financial(public.obra_id_of_item(item_id)))
  with check (public.can_view_obra_financial(public.obra_id_of_item(item_id)));

-- crm_recebiveis
create policy "rec: financial read"
  on public.crm_recebiveis for select to authenticated
  using (public.can_view_obra_financial(obra_id));
create policy "rec: financial write"
  on public.crm_recebiveis for all to authenticated
  using (public.can_view_obra_financial(obra_id))
  with check (public.can_view_obra_financial(obra_id));

-- crm_fase_templates
create policy "tpl: authenticated read"
  on public.crm_fase_templates for select to authenticated
  using (is_global = true or created_by = auth.uid() or public.is_crm_admin());
create policy "tpl: own/admin write"
  on public.crm_fase_templates for all to authenticated
  using (public.is_crm_admin() or created_by = auth.uid())
  with check (public.is_crm_admin() or created_by = auth.uid());

create policy "tpl_itens: read"
  on public.crm_fase_template_itens for select to authenticated
  using (
    exists (
      select 1 from public.crm_fase_templates t
      where t.id = template_id and (t.is_global or t.created_by = auth.uid() or public.is_crm_admin())
    )
  );
create policy "tpl_itens: write"
  on public.crm_fase_template_itens for all to authenticated
  using (
    exists (
      select 1 from public.crm_fase_templates t
      where t.id = template_id and (public.is_crm_admin() or t.created_by = auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.crm_fase_templates t
      where t.id = template_id and (public.is_crm_admin() or t.created_by = auth.uid())
    )
  );

-- crm_audit_log
create policy "audit: admin read"
  on public.crm_audit_log for select to authenticated
  using (public.is_crm_admin());
create policy "audit: authenticated insert"
  on public.crm_audit_log for insert to authenticated
  with check (auth.uid() is not null);
