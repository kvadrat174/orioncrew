CREATE TABLE "users" (
	"id" bigint PRIMARY KEY NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"username" varchar(100) NOT NULL,
	"avatar" varchar DEFAULT '' NOT NULL,
	"language_code" varchar(20) NOT NULL,
	"isBot" boolean,
	"isPremium" boolean,
	"role" varchar(20) DEFAULT 'user',
	"vessel" varchar(20) DEFAULT 'Orion',
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(50) NOT NULL,
	"departure" timestamp NOT NULL,
	"duration" numeric DEFAULT '3',
	"vessel" varchar(50) DEFAULT 'Orion',
	"status" varchar(20) DEFAULT 'planned',
	"updated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "trip_users" (
	"trip_id" uuid NOT NULL,
	"user_id" bigint NOT NULL,
	"role" varchar(50) DEFAULT 'crew',
	"kicked" boolean DEFAULT false,
	"deleted_at" timestamp,
	CONSTRAINT "trip_users_trip_id_user_id_pk" PRIMARY KEY("trip_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"last_activity_at" timestamp DEFAULT now() NOT NULL,
	"logout_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "trip_users" ADD CONSTRAINT "trip_users_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_users" ADD CONSTRAINT "trip_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;


--> statement-breakpoint
-- Добавление тестовых пользователей
INSERT INTO "users" ("id", "first_name", "last_name", "username", "language_code", "role")
VALUES 
  (715698611, 'Андрей', 'Осокин', 'andrey_osokin', 'ru', 'crew'),
  (537099586, 'Любовь', 'Осокина', 'lyubov_osokina', 'ru', 'crew'),
  (369308963, 'Руслан', 'Булко', 'ruslan_bulko', 'ru', 'crew'),
  (919178541, 'Анатолий', 'Васильев', 'anatoly_vasilyev', 'ru', 'crew'),
  (233446249, 'Богдан', 'Горбонос', 'bogdan_gorbonos', 'ru', 'crew'),
  (798914962, 'Алена', 'Деньгина', 'alena_denygina', 'ru', 'crew'),
  (1911744595, 'Григол', 'Дзнеладзе', 'grigol_dzneladze', 'ru', 'crew'),
  (5472529389, 'Софья', 'Егорова', 'sofia_egorova', 'ru', 'crew'),
  (662611978, 'Ольга', 'Ерохина', 'olga_erokhina', 'ru', 'crew'),
  (265643829, 'Дмитрий', 'Клиндухов', 'dmitry_klinduhov', 'ru', 'crew'),
  (409395483, 'Ксения', 'Коваленко', 'ksenia_kovalenko', 'ru', 'crew'),
  (1286900866, 'Сергей', 'Колганов', 'sergey_kolganov', 'ru', 'crew'),
  (468311784, 'Екатерина', 'Коровникова', 'ekaterina_korovnikova', 'ru', 'crew'),
  (183324271, 'Ольга', 'Курочкина', 'olga_kurochkina', 'ru', 'boatswain'),
  (1460056711, 'Софья', 'Кутявина', 'sofia_kutyavina', 'ru', 'crew'),
  (52684281, 'Елена', 'Лапина', 'elena_lapina', 'ru', 'crew'),
  (349563534, 'Михаил', 'Николаиди', 'mikhail_nikolaidi', 'ru', 'crew'),
  (551767700, 'Константин', 'Обухов', 'konstantin_obuhov', 'ru', 'crew'),
  (513887946, 'Екатерина', 'Потёмина', 'ekaterina_potemina', 'ru', 'crew'),
  (1630678266, 'Янина', 'Прунт', 'yanina_prunt', 'ru', 'user'),
  (78451421, 'Сергей', 'Сергеев', 'sergey_sergeev', 'ru', 'user'),
  (442679054, 'Полина', 'Сковронок', 'polina_skovronok', 'ru', 'user'),
  (583162379, 'Александра', 'Смолянская', 'aleksandra_smolyanskaya', 'ru', 'crew'),
  (1219992953, 'Мария', 'Стукова', 'maria_stukova', 'ru', 'crew'),
  (1233716907, 'Ольга', 'Фёдорова', 'olga_fedorova', 'ru', 'crew'),
  (440598893, 'Дмитрий', 'Фирюлёв', 'dmitry_firulyov', 'ru', 'crew'),
  (482256970, 'Анастасия', 'Чуприна', 'anastasia_chuprina', 'ru', 'crew'),
  (1252305332, 'Ирина', 'Шумакова', 'irina_shumakova', 'ru', 'crew'),
  (654752954, 'Павел', 'Шумаков', 'pavel_shumakov', 'ru', 'crew'),
  (253265788, 'Михаил', 'Лепешкин', 'captain_orion', 'ru', 'captain');