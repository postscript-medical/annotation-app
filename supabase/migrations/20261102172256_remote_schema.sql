SET local check_function_bodies = off;

CREATE EXTENSION "pgjwt" SCHEMA "extensions";

CREATE TABLE "public"."illustration_raw" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "fauna_id"   text                     NOT NULL,
  "fauna_ts"   bigint                   NOT NULL,
  "data"       jsonb                    NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "illustration_raw_fauna_id_key" UNIQUE (fauna_id),
  CONSTRAINT "illustration_raw_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."illustrations" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "original_source_id"   text                     NOT NULL,
  "name"                 text                     NOT NULL,
  "src"                  text                     NOT NULL,
  "default_illustration" boolean                  NOT NULL DEFAULT false,
  "illustration_aliases" text[]                   DEFAULT ARRAY[]::text[],
  "created_at"           timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"           timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "illustrations_original_source_id_key" UNIQUE (original_source_id),
  CONSTRAINT "illustrations_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."migration_failures" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "table_name"         text,
  "original_source_id" text,
  "error_message"      text,
  "raw_data"           jsonb,
  "created_at"         timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "migration_failures_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."organization_raw" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "fauna_id"   text                     NOT NULL,
  "fauna_ts"   bigint                   NOT NULL,
  "data"       jsonb                    NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "organization_raw_fauna_id_key" UNIQUE (fauna_id),
  CONSTRAINT "organization_raw_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."organizations" (
  "id"                    uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "original_source_id"    text                     NOT NULL,
  "name"                  text                     NOT NULL,
  "email"                 text,
  "stripe_id"             text,
  "max_users"             integer,
  "max_specialties"       integer,
  "subscription_level"    text,
  "available_specialties" text                     NOT NULL DEFAULT 'all'::text,
  "created_at"            timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"            timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "organizations_available_specialties_check" CHECK ((available_specialties = ANY (ARRAY['all'::text, 'restricted'::text]))),
  CONSTRAINT "organizations_original_source_id_key" UNIQUE (original_source_id),
  CONSTRAINT "organizations_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."product_prices" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "product_id" uuid                     NOT NULL,
  "currency"   character(3)             NOT NULL,
  "amount"     numeric(10,2)            NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at" timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "product_prices_amount_check" CHECK ((amount >= (0)::numeric)),
  CONSTRAINT "product_prices_pkey" PRIMARY KEY (id),
  CONSTRAINT "product_prices_product_id_currency_key" UNIQUE (product_id, currency)
);

CREATE TABLE "public"."products_raw" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "fauna_id"   text                     NOT NULL,
  "fauna_ts"   bigint                   NOT NULL,
  "data"       jsonb                    NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "products_raw_fauna_id_key" UNIQUE (fauna_id),
  CONSTRAINT "products_raw_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."products" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "original_source_id" text                     NOT NULL,
  "name"               text                     NOT NULL,
  "type"               text                     NOT NULL,
  "features"           text[]                   NOT NULL DEFAULT '{}'::text[],
  "created_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "products_original_source_id_key" UNIQUE (original_source_id),
  CONSTRAINT "products_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."restricted_organization_specialties" (
  "organization_id" uuid                     NOT NULL,
  "specialty_id"    uuid                     NOT NULL,
  "is_primary"      boolean                  NOT NULL DEFAULT false,
  "created_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "check_is_primary_boolean" CHECK ((is_primary = ANY (ARRAY[true, false]))),
  CONSTRAINT "restricted_organization_specialties_pkey" PRIMARY KEY (organization_id, specialty_id)
);

CREATE TABLE "public"."specialties" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "original_source_id" text                     NOT NULL,
  "name"               text                     NOT NULL,
  "created_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "specialties_original_source_id_key" UNIQUE (original_source_id),
  CONSTRAINT "specialties_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."specialty_raw" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "fauna_id"   text                     NOT NULL,
  "fauna_ts"   bigint                   NOT NULL,
  "data"       jsonb                    NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "specialty_raw_fauna_id_key" UNIQUE (fauna_id),
  CONSTRAINT "specialty_raw_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."specialty_sub_specialties" (
  "specialty_id"     uuid                     NOT NULL,
  "sub_specialty_id" uuid                     NOT NULL,
  "created_at"       timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "specialty_sub_specialties_pkey" PRIMARY KEY (specialty_id, sub_specialty_id)
);

CREATE TABLE "public"."sub_specialties" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "original_source_id" text                     NOT NULL,
  "name"               text                     NOT NULL,
  "created_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "sub_specialties_original_source_id_key" UNIQUE (original_source_id),
  CONSTRAINT "sub_specialties_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."sub_specialty_illustrations" (
  "sub_specialty_id" uuid                     NOT NULL,
  "illustration_id"  uuid                     NOT NULL,
  "created_at"       timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"       timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "sub_specialty_illustrations_pkey" PRIMARY KEY (sub_specialty_id, illustration_id)
);

CREATE TABLE "public"."sub_specialty_raw" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "fauna_id"   text                     NOT NULL,
  "fauna_ts"   bigint                   NOT NULL,
  "data"       jsonb                    NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "sub_specialty_raw_fauna_id_key" UNIQUE (fauna_id),
  CONSTRAINT "sub_specialty_raw_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."subscription_plan_products" (
  "id"                   uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "subscription_plan_id" uuid                     NOT NULL,
  "product_id"           uuid                     NOT NULL,
  "created_at"           timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"           timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "subscription_plan_products_pkey" PRIMARY KEY (id),
  CONSTRAINT "subscription_plan_products_subscription_plan_id_product_id_key" UNIQUE (subscription_plan_id, product_id)
);

CREATE TABLE "public"."subscription_plans_raw" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "fauna_id"   text                     NOT NULL,
  "fauna_ts"   bigint                   NOT NULL,
  "data"       jsonb                    NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "subscription_plans_raw_fauna_id_key" UNIQUE (fauna_id),
  CONSTRAINT "subscription_plans_raw_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."subscription_plans" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "original_source_id" text                     NOT NULL,
  "name"               text                     NOT NULL,
  "level"              text                     NOT NULL,
  "max_teams"          integer                  NOT NULL DEFAULT 1,
  "max_users"          integer                  NOT NULL DEFAULT 1,
  "created_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "subscription_plans_original_source_id_key" UNIQUE (original_source_id),
  CONSTRAINT "subscription_plans_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."team_raw" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "fauna_id"   text                     NOT NULL,
  "fauna_ts"   bigint                   NOT NULL,
  "data"       jsonb                    NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "team_raw_fauna_id_key" UNIQUE (fauna_id),
  CONSTRAINT "team_raw_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."teams" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "original_source_id" text                     NOT NULL,
  "name"               text                     NOT NULL,
  "organization_id"    uuid                     NOT NULL,
  "created_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "teams_original_source_id_key" UNIQUE (original_source_id),
  CONSTRAINT "teams_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."user_app_state_raw" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "fauna_id"   text                     NOT NULL,
  "fauna_ts"   bigint                   NOT NULL,
  "data"       jsonb                    NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_app_state_raw_fauna_id_key" UNIQUE (fauna_id),
  CONSTRAINT "user_app_state_raw_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."user_app_states" (
  "id"                        uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "original_source_id"        text                     NOT NULL,
  "user_id"                   uuid                     NOT NULL,
  "selected_specialty_id"     uuid,
  "selected_sub_specialty_id" uuid,
  "selected_illustration_id"  uuid,
  "created_at"                timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"                timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT "user_app_states_original_source_id_key" UNIQUE (original_source_id),
  CONSTRAINT "user_app_states_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."user_raw" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "fauna_id"   text                     NOT NULL,
  "fauna_ts"   bigint                   NOT NULL,
  "data"       jsonb                    NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_raw_fauna_id_key" UNIQUE (fauna_id),
  CONSTRAINT "user_raw_pkey" PRIMARY KEY (id)
);

CREATE TABLE "public"."users" (
  "id"                 uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "original_source_id" text                     NOT NULL,
  "email"              text                     NOT NULL,
  "first_name"         text,
  "last_name"          text,
  "role"               text                     NOT NULL,
  "show_tutorial"      boolean                  NOT NULL DEFAULT true,
  "netlify_id"         text,
  "team_id"            uuid,
  "created_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "updated_at"         timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  "auth_id"            uuid,
  CONSTRAINT "users_email_key" UNIQUE (email),
  CONSTRAINT "users_original_source_id_key" UNIQUE (original_source_id),
  CONSTRAINT "users_pkey" PRIMARY KEY (id)
);

CREATE OR REPLACE FUNCTION public.set_timestamps_on_insert()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    -- Check if the timestamp columns exist in the NEW record before setting them
    -- This handles cases where columns aren't explicitly included in INSERT statements
    BEGIN
        NEW.created_at = timezone('utc'::text, now());
    EXCEPTION WHEN OTHERS THEN
        -- Column doesn't exist or can't be set, skip
        NULL;
    END;
    
    BEGIN
        NEW.updated_at = timezone('utc'::text, now());
    EXCEPTION WHEN OTHERS THEN
        -- Column doesn't exist or can't be set, skip
        NULL;
    END;
    
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_timestamps_on_update()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$function$;

ALTER TABLE "public"."product_prices"
  ADD CONSTRAINT "product_prices_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE "public"."restricted_organization_specialties"
  ADD CONSTRAINT "restricted_organization_specialties_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."restricted_organization_specialties"
  ADD CONSTRAINT "restricted_organization_specialties_specialty_id_fkey" FOREIGN KEY (specialty_id) REFERENCES public.specialties(id) ON DELETE CASCADE;

ALTER TABLE "public"."specialty_sub_specialties"
  ADD CONSTRAINT "specialty_sub_specialties_specialty_id_fkey" FOREIGN KEY (specialty_id) REFERENCES public.specialties(id) ON DELETE CASCADE;

ALTER TABLE "public"."specialty_sub_specialties"
  ADD CONSTRAINT "specialty_sub_specialties_sub_specialty_id_fkey" FOREIGN KEY (sub_specialty_id) REFERENCES public.sub_specialties(id) ON DELETE CASCADE;

ALTER TABLE "public"."sub_specialty_illustrations"
  ADD CONSTRAINT "sub_specialty_illustrations_illustration_id_fkey" FOREIGN KEY (illustration_id) REFERENCES public.illustrations(id) ON DELETE CASCADE;

ALTER TABLE "public"."sub_specialty_illustrations"
  ADD CONSTRAINT "sub_specialty_illustrations_sub_specialty_id_fkey" FOREIGN KEY (sub_specialty_id) REFERENCES public.sub_specialties(id) ON DELETE CASCADE;

ALTER TABLE "public"."subscription_plan_products"
  ADD CONSTRAINT "subscription_plan_products_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

ALTER TABLE "public"."subscription_plan_products"
  ADD CONSTRAINT "subscription_plan_products_subscription_plan_id_fkey" FOREIGN KEY (subscription_plan_id) REFERENCES public.subscription_plans(id) ON DELETE CASCADE;

ALTER TABLE "public"."teams"
  ADD CONSTRAINT "teams_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_app_states"
  ADD CONSTRAINT "user_app_states_selected_illustration_id_fkey" FOREIGN KEY (selected_illustration_id) REFERENCES public.illustrations(id) ON DELETE SET NULL;

ALTER TABLE "public"."user_app_states"
  ADD CONSTRAINT "user_app_states_selected_specialty_id_fkey" FOREIGN KEY (selected_specialty_id) REFERENCES public.specialties(id) ON DELETE SET NULL;

ALTER TABLE "public"."user_app_states"
  ADD CONSTRAINT "user_app_states_selected_sub_specialty_id_fkey" FOREIGN KEY (selected_sub_specialty_id) REFERENCES public.sub_specialties(id) ON DELETE SET NULL;

ALTER TABLE "public"."users"
  ADD CONSTRAINT "users_auth_id_fkey" FOREIGN KEY (auth_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."user_app_states"
  ADD CONSTRAINT "user_app_states_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."users"
  ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY (team_id) REFERENCES public.teams(id) ON DELETE SET NULL;

CREATE INDEX idx_illustration_raw_fauna_id ON public.illustration_raw USING btree (fauna_id);

CREATE INDEX idx_illustrations_title ON public.illustrations USING btree (name);

CREATE INDEX idx_organization_raw_fauna_id ON public.organization_raw USING btree (fauna_id);

CREATE INDEX idx_product_prices_product_id ON public.product_prices USING btree (product_id);

CREATE INDEX idx_products_raw_fauna_id ON public.products_raw USING btree (fauna_id);

CREATE INDEX idx_restricted_organization_specialties_primary ON public.restricted_organization_specialties USING btree (organization_id, is_primary)
  WHERE (is_primary = true);

CREATE INDEX idx_restricted_organization_specialties_specialty_id ON public.restricted_organization_specialties USING btree (specialty_id);

CREATE INDEX idx_specialties_name ON public.specialties USING btree (name);

CREATE INDEX idx_specialty_raw_fauna_id ON public.specialty_raw USING btree (fauna_id);

CREATE INDEX idx_specialty_sub_specialties_sub_specialty_id ON public.specialty_sub_specialties USING btree (sub_specialty_id);

CREATE INDEX idx_sub_specialties_name ON public.sub_specialties USING btree (name);

CREATE INDEX idx_sub_specialty_illustrations_illustration_id ON public.sub_specialty_illustrations USING btree (illustration_id);

CREATE INDEX idx_sub_specialty_raw_fauna_id ON public.sub_specialty_raw USING btree (fauna_id);

CREATE INDEX idx_subscription_plan_products_product_id ON public.subscription_plan_products USING btree (product_id);

CREATE INDEX idx_subscription_plan_products_subscription_plan_id ON public.subscription_plan_products USING btree (subscription_plan_id);

CREATE INDEX idx_subscription_plans_raw_fauna_id ON public.subscription_plans_raw USING btree (fauna_id);

CREATE INDEX idx_team_raw_fauna_id ON public.team_raw USING btree (fauna_id);

CREATE INDEX idx_teams_org_id ON public.teams USING btree (organization_id);

CREATE INDEX idx_user_app_state_raw_fauna_id ON public.user_app_state_raw USING btree (fauna_id);

CREATE INDEX idx_user_app_states_user_id ON public.user_app_states USING btree (user_id);

CREATE INDEX idx_user_raw_fauna_id ON public.user_raw USING btree (fauna_id);

CREATE INDEX idx_users_auth_id ON public.users USING btree (auth_id);

CREATE INDEX idx_users_team_id ON public.users USING btree (team_id);

CREATE TRIGGER set_illustrations_timestamps
  BEFORE INSERT ON public.illustrations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_insert();

CREATE TRIGGER update_illustrations_updated_at
  BEFORE UPDATE ON public.illustrations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_update();

CREATE TRIGGER set_migration_failures_timestamps
  BEFORE INSERT ON public.migration_failures
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_insert();

CREATE TRIGGER set_organizations_timestamps
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_insert();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_update();

CREATE TRIGGER set_product_prices_timestamps
  BEFORE INSERT ON public.product_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_insert();

CREATE TRIGGER update_product_prices_updated_at
  BEFORE UPDATE ON public.product_prices
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_update();

CREATE TRIGGER set_products_timestamps
  BEFORE INSERT ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_insert();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_update();

CREATE TRIGGER set_restricted_organization_specialties_timestamps
  BEFORE INSERT ON public.restricted_organization_specialties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_insert();

CREATE TRIGGER update_restricted_organization_specialties_updated_at
  BEFORE UPDATE ON public.restricted_organization_specialties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_update();

CREATE TRIGGER set_specialties_timestamps
  BEFORE INSERT ON public.specialties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_insert();

CREATE TRIGGER update_specialties_updated_at
  BEFORE UPDATE ON public.specialties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_update();

CREATE TRIGGER set_specialty_sub_specialties_timestamps
  BEFORE INSERT ON public.specialty_sub_specialties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_insert();

CREATE TRIGGER update_specialty_sub_specialties_updated_at
  BEFORE UPDATE ON public.specialty_sub_specialties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_update();

CREATE TRIGGER set_sub_specialties_timestamps
  BEFORE INSERT ON public.sub_specialties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_insert();

CREATE TRIGGER update_sub_specialties_updated_at
  BEFORE UPDATE ON public.sub_specialties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_update();

CREATE TRIGGER set_sub_specialty_illustrations_timestamps
  BEFORE INSERT ON public.sub_specialty_illustrations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_insert();

CREATE TRIGGER update_sub_specialty_illustrations_updated_at
  BEFORE UPDATE ON public.sub_specialty_illustrations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_update();

CREATE TRIGGER set_subscription_plan_products_timestamps
  BEFORE INSERT ON public.subscription_plan_products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_insert();

CREATE TRIGGER update_subscription_plan_products_updated_at
  BEFORE UPDATE ON public.subscription_plan_products
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_update();

CREATE TRIGGER set_subscription_plans_timestamps
  BEFORE INSERT ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_insert();

CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_update();

CREATE TRIGGER set_teams_timestamps
  BEFORE INSERT ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_insert();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_update();

CREATE TRIGGER set_user_app_states_timestamps
  BEFORE INSERT ON public.user_app_states
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_insert();

CREATE TRIGGER update_user_app_states_updated_at
  BEFORE UPDATE ON public.user_app_states
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_update();

CREATE TRIGGER set_users_timestamps
  BEFORE INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_insert();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.set_timestamps_on_update();

CREATE POLICY "Anyone can upload an avatar." ON "storage"."objects"
  FOR INSERT
  TO PUBLIC
  WITH CHECK ((bucket_id = 'avatars'::text));

CREATE POLICY "Avatar images are publicly accessible." ON "storage"."objects"
  FOR SELECT
  TO PUBLIC
  USING ((bucket_id = 'avatars'::text));

COMMENT ON EXTENSION "pgjwt" IS 'JSON Web Token API for Postgresql';

GRANT EXECUTE ON FUNCTION "public"."set_timestamps_on_insert"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."set_timestamps_on_insert"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_timestamps_on_insert"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_timestamps_on_insert"() TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."set_timestamps_on_update"() TO PUBLIC, "anon", "authenticated";

REVOKE ALL ON FUNCTION "public"."set_timestamps_on_update"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_timestamps_on_update"() TO "postgres";

GRANT EXECUTE ON FUNCTION "public"."set_timestamps_on_update"() TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."illustration_raw" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."illustration_raw" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."illustration_raw" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."illustration_raw" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."illustrations" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."illustrations" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."illustrations" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."illustrations" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."migration_failures" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."migration_failures" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."migration_failures" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."migration_failures" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organization_raw" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."organization_raw" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organization_raw" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organization_raw" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organizations" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."organizations" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organizations" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."organizations" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_prices" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."product_prices" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_prices" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."product_prices" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."products" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products_raw" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."products_raw" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products_raw" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."products_raw" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."restricted_organization_specialties" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."restricted_organization_specialties" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."restricted_organization_specialties" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."restricted_organization_specialties" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."specialties" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."specialties" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."specialties" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."specialties" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."specialty_raw" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."specialty_raw" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."specialty_raw" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."specialty_raw" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."specialty_sub_specialties" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."specialty_sub_specialties" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."specialty_sub_specialties" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."specialty_sub_specialties" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sub_specialties" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."sub_specialties" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sub_specialties" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sub_specialties" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sub_specialty_illustrations" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."sub_specialty_illustrations" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sub_specialty_illustrations" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sub_specialty_illustrations" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sub_specialty_raw" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."sub_specialty_raw" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sub_specialty_raw" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sub_specialty_raw" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subscription_plan_products" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."subscription_plan_products" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subscription_plan_products" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subscription_plan_products" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subscription_plans" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."subscription_plans" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subscription_plans" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subscription_plans" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subscription_plans_raw" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."subscription_plans_raw" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subscription_plans_raw" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."subscription_plans_raw" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."team_raw" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."team_raw" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."team_raw" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."team_raw" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."teams" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."teams" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."teams" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."teams" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_app_state_raw" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."user_app_state_raw" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_app_state_raw" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_app_state_raw" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_app_states" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."user_app_states" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_app_states" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_app_states" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_raw" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."user_raw" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_raw" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."user_raw" TO "service_role";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "anon", "authenticated";

REVOKE ALL ON TABLE "public"."users" FROM "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "postgres";

GRANT DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" TO "service_role";

