create table "public"."raffle" (
    "userId" character varying not null
);


CREATE UNIQUE INDEX raffle_pkey ON public.raffle USING btree ("userId");

alter table "public"."raffle" add constraint "raffle_pkey" PRIMARY KEY using index "raffle_pkey";

alter table "public"."raffle" add constraint "raffle_userId_fkey" FOREIGN KEY ("userId") REFERENCES users("userId") ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."raffle" validate constraint "raffle_userId_fkey";

grant delete on table "public"."raffle" to "anon";

grant insert on table "public"."raffle" to "anon";

grant references on table "public"."raffle" to "anon";

grant select on table "public"."raffle" to "anon";

grant trigger on table "public"."raffle" to "anon";

grant truncate on table "public"."raffle" to "anon";

grant update on table "public"."raffle" to "anon";

grant delete on table "public"."raffle" to "authenticated";

grant insert on table "public"."raffle" to "authenticated";

grant references on table "public"."raffle" to "authenticated";

grant select on table "public"."raffle" to "authenticated";

grant trigger on table "public"."raffle" to "authenticated";

grant truncate on table "public"."raffle" to "authenticated";

grant update on table "public"."raffle" to "authenticated";

grant delete on table "public"."raffle" to "service_role";

grant insert on table "public"."raffle" to "service_role";

grant references on table "public"."raffle" to "service_role";

grant select on table "public"."raffle" to "service_role";

grant trigger on table "public"."raffle" to "service_role";

grant truncate on table "public"."raffle" to "service_role";

grant update on table "public"."raffle" to "service_role";



