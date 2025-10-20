alter table "public"."santaLetters" drop constraint "santaLetters_pkey";

drop index if exists "public"."santaLetters_pkey";

create table "public"."santaLetters_2022" (
    "userId" character varying not null,
    "region" "santaRegion" not null,
    "postCount" integer not null,
    "content" text not null,
    "matcheeId" character varying
);


alter table "public"."santaLetters" drop column "postCount";

alter table "public"."settings" drop column "minCncPoints";

alter table "public"."users" add column "canParticipateInSecretSanta" boolean;

CREATE UNIQUE INDEX "santaLetters_pkey1" ON public."santaLetters" USING btree ("userId");

CREATE UNIQUE INDEX "santaLetters_pkey" ON public."santaLetters_2022" USING btree ("userId");

alter table "public"."santaLetters" add constraint "santaLetters_pkey1" PRIMARY KEY using index "santaLetters_pkey1";

alter table "public"."santaLetters_2022" add constraint "santaLetters_pkey" PRIMARY KEY using index "santaLetters_pkey";


