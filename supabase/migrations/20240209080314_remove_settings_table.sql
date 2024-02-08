revoke delete on table "public"."settings" from "anon";

revoke insert on table "public"."settings" from "anon";

revoke references on table "public"."settings" from "anon";

revoke select on table "public"."settings" from "anon";

revoke trigger on table "public"."settings" from "anon";

revoke truncate on table "public"."settings" from "anon";

revoke update on table "public"."settings" from "anon";

revoke delete on table "public"."settings" from "authenticated";

revoke insert on table "public"."settings" from "authenticated";

revoke references on table "public"."settings" from "authenticated";

revoke select on table "public"."settings" from "authenticated";

revoke trigger on table "public"."settings" from "authenticated";

revoke truncate on table "public"."settings" from "authenticated";

revoke update on table "public"."settings" from "authenticated";

revoke delete on table "public"."settings" from "postgres";

revoke insert on table "public"."settings" from "postgres";

revoke references on table "public"."settings" from "postgres";

revoke select on table "public"."settings" from "postgres";

revoke trigger on table "public"."settings" from "postgres";

revoke truncate on table "public"."settings" from "postgres";

revoke update on table "public"."settings" from "postgres";

revoke delete on table "public"."settings" from "service_role";

revoke insert on table "public"."settings" from "service_role";

revoke references on table "public"."settings" from "service_role";

revoke select on table "public"."settings" from "service_role";

revoke trigger on table "public"."settings" from "service_role";

revoke truncate on table "public"."settings" from "service_role";

revoke update on table "public"."settings" from "service_role";

alter table "public"."settings" drop constraint "settings_pkey";

drop index if exists "public"."settings_pkey";

drop table "public"."settings";



