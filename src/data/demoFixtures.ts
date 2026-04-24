import type { PostDraftRecord } from "@/domain/smm";
import { H_MS, MOCK_DISCUSSION_REF_MS } from "@/domain/smm";

/** Статичные строки для prisma seed (старые id c1…, p1…). */
export const demoClientsFixture = [
  {
    id: "c1",
    fullName: "Ирина Волкова",
    instagramUsername: "volkovabeauty",
    activitySpheres: ["Косметология", "Личный бренд"],
  },
  {
    id: "c2",
    fullName: "ООО «Городская кофейня»",
    instagramUsername: "brewcorner_spb",
    activitySpheres: ["HoReCa"],
  },
  {
    id: "c3",
    fullName: "Максим Орлов",
    instagramUsername: "orlov_fit",
    activitySpheres: ["Фитнес", "Онлайн-курсы"],
  },
  {
    id: "c4",
    fullName: "Студия «Линия»",
    instagramUsername: "linia_interior",
    activitySpheres: ["Дизайн интерьеров"],
  },
  {
    id: "c5",
    fullName: "Елена Соколова",
    instagramUsername: "elena_psy_talk",
    activitySpheres: ["Психология", "Личный бренд"],
  },
];

export const demoPostsFixture: PostDraftRecord[] = [
  {
    id: "p1",
    clientId: "c1",
    clientReviewToken:
      "smmrv_e39a1f8c4b2d7094e8c1f5a3b7d9062e4c8a1f3b5d7092e4c6a8f0b2d4e6a8c0f2a4b6d8e0",
    status: "in_review",
    postType: "feed",
    caption:
      "Зима коже не враг, если есть правильный барьер 💧\n\n" +
      "3 шага вечером, которые делаю всегда: снятие макияжа, сыворотка с пептидами, крем с керамидами.\n\n" +
      "Без лишнего, но со смыслом. А вы в команде #укходзимой или #минималукход?\n\n" +
      "#косметология #уход #краснодар #кожа",
    location: "Клиника «Volkova»",
    firstComment:
      "Полезные продукты, которые в посте, можно смотреть в закрепе — написать «+» в личные сообщения.",
    altText:
      "Макро кожи, на фоне мягкое полотенце и пузырёк зимнего увлажняющего крема",
    imageUrls: [
      "https://images.unsplash.com/photo-1556228578-0d85b1a4d651?w=800&q=80",
    ],
    publishDate: "2026-04-26",
    publishTime: "11:00",
    createdAt: "2026-04-24T14:22:00+03:00",
    discussion: [
      {
        id: "p1-d1",
        side: "self",
        text: "Пожалуйста, проверьте хэштеги — не слишком ли много?",
        createdAt: MOCK_DISCUSSION_REF_MS - 2 * H_MS,
      },
      {
        id: "p1-d2",
        side: "client",
        text: "Хэштеги хорошие, но цвет «малиновый» — замените на «вишнёвый»",
        createdAt: MOCK_DISCUSSION_REF_MS - 1 * H_MS,
      },
    ],
  },
  {
    id: "p2",
    clientId: "c2",
    clientReviewToken:
      "smmrv_7c2b9e1f4a806d395e7b0c2f8a4d6913c5e7a9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9",
    status: "scheduled",
    postType: "reels",
    caption:
      "Новый вкус: ягоды + шоколад, без сиропа, только пурэ и кофе ☕\n" +
      "снимали за один кадр — 15 сек, чтобы было по делу, без «слайдеров в ресторане на час»\n" +
      "#нашкофе #сезонныенапитки #санктпетербург",
    location: "",
    firstComment: "",
    altText: "Крупный план: бариста вливает молоко в стакан с пеной, графика на стене",
    imageUrls: [
      "https://images.unsplash.com/photo-1495474472287-4d71b27bfe40?w=800&q=80",
    ],
    publishDate: "2026-04-27",
    publishTime: "10:30",
    createdAt: "2026-04-24T09:15:00+03:00",
    discussion: [
      {
        id: "p2-d1",
        side: "self",
        text: "Можно финальный кадр с логотипом на стакане?",
        createdAt: MOCK_DISCUSSION_REF_MS - 3 * H_MS,
      },
      {
        id: "p2-d2",
        side: "client",
        text: "Да, в конце 2 секунды — только лого, без текста.",
        createdAt: MOCK_DISCUSSION_REF_MS - 2 * H_MS,
      },
      {
        id: "p2-d3",
        side: "self",
        text: "Принято, перезалью превью к вечеру.",
        createdAt: MOCK_DISCUSSION_REF_MS - 40 * 60 * 1000,
      },
    ],
  },
  {
    id: "p3",
    clientId: "c3",
    clientReviewToken:
      "smmrv_1a3c5e7b9d1f3a5c7e9b1d3f5a7c9e1b3d5f7a9c1e3b5d7f9a1c3e5b7d9f1a3c5e7",
    status: "draft",
    postType: "photo",
    caption:
      "Разбор приседаний: колени, глубина, дыхание — короткий чек-лист перед тренировкой.\n" +
      "#фитнес #присед #разминка",
    location: "Зал «Орлов»",
    firstComment: "",
    altText: "Тренер в зале показывает правильную стойку ног при приседе",
    imageUrls: [
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80",
    ],
    publishDate: "2026-04-28",
    publishTime: "19:00",
    createdAt: "2026-04-23T18:00:00+03:00",
  },
  {
    id: "p4",
    clientId: "c4",
    clientReviewToken:
      "smmrv_04f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021222324",
    status: "scheduled",
    postType: "photo",
    caption:
      "До/после: 12 м² — кухня в тёплых тонах, без лишнего декора.\n" +
      "#интерьер #кухня #линия",
    location: "Студия «Линия»",
    firstComment: "",
    altText: "Светлая кухня с деревянной столешницей и встроенной техникой",
    imageUrls: [
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80",
    ],
    publishDate: "2026-04-24",
    publishTime: "18:30",
    createdAt: "2026-04-22T11:00:00+03:00",
  },
  {
    id: "p5",
    clientId: "c5",
    clientReviewToken:
      "smmrv_05f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021222525",
    status: "scheduled",
    postType: "feed",
    caption:
      "Про границы без обид: одна фраза, которую можно сказать близкому и не «закрыть» диалог.\n" +
      "#психология #отношения",
    location: "",
    firstComment: "",
    altText: "Два человека за столом ведут спокойный разговор",
    imageUrls: [
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&q=80",
    ],
    publishDate: "2026-04-25",
    publishTime: "09:00",
    createdAt: "2026-04-23T10:30:00+03:00",
  },
  {
    id: "p6",
    clientId: "c1",
    clientReviewToken:
      "smmrv_06f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021222626",
    status: "scheduled",
    postType: "reels",
    caption:
      "60 секунд: как понять, что коже не хватает влаги — и что делать вечером.\n" +
      "#косметология #уход",
    location: "",
    firstComment: "",
    altText: "Косметолог наносит средство на кожу лица клиентки",
    imageUrls: [
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80",
    ],
    publishDate: "2026-04-25",
    publishTime: "16:00",
    createdAt: "2026-04-24T08:00:00+03:00",
  },
  {
    id: "p7",
    clientId: "c3",
    clientReviewToken:
      "smmrv_07f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021222727",
    status: "scheduled",
    postType: "photo",
    caption:
      "План на неделю: 3 силовых, 1 лёгкое кардио, сон — без фанатизма, но со смыслом.\n" +
      "#фитнес #план",
    location: "",
    firstComment: "",
    altText: "Гантели и коврик в спортзале",
    imageUrls: [
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
    ],
    publishDate: "2026-04-26",
    publishTime: "08:00",
    createdAt: "2026-04-21T16:20:00+03:00",
  },
  {
    id: "p8",
    clientId: "c2",
    clientReviewToken:
      "smmrv_08f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021222828",
    status: "scheduled",
    postType: "feed",
    caption:
      "Выходные в Brew Corner: фильтр из Эфиопии + пирожное с малиной — только до воскресенья.\n" +
      "#brewcorner #спб",
    location: "Brew Corner",
    firstComment: "Меню недели — в закрепе сторис.",
    altText: "Чашка кофе с латте-артом на деревянном столе",
    imageUrls: [
      "https://images.unsplash.com/photo-1495474472287-4d71b27bfe40?w=800&q=80",
    ],
    publishDate: "2026-04-26",
    publishTime: "12:30",
    createdAt: "2026-04-23T07:45:00+03:00",
  },
  {
    id: "p9",
    clientId: "c4",
    clientReviewToken:
      "smmrv_09f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021222929",
    status: "in_review",
    postType: "stories",
    caption:
      "Опрос: какой цвет фартука на кухне — тёплый песок или холодный серый?",
    location: "",
    firstComment: "",
    altText: "Образцы фактур кухонного фартука",
    imageUrls: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
    ],
    publishDate: "2026-05-06",
    publishTime: "18:00",
    createdAt: "2026-04-24T11:10:00+03:00",
  },
  {
    id: "p10",
    clientId: "c2",
    clientReviewToken:
      "smmrv_10f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021223030",
    status: "draft",
    postType: "reels",
    caption:
      "Закулисье: как мы готовим сезонный сироп — без красителей, только ягода и сахар.",
    location: "",
    firstComment: "",
    altText: "Бариста наливает сироп в стеклянную бутыль",
    imageUrls: [
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
    ],
    publishDate: "2026-05-08",
    publishTime: "11:00",
    createdAt: "2026-04-20T14:00:00+03:00",
  },
  {
    id: "p11",
    clientId: "c5",
    clientReviewToken:
      "smmrv_11f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021223131",
    status: "scheduled",
    postType: "feed",
    caption:
      "Коротко о тревоге перед важным разговором: что помогает за 5 минут до звонка.\n" +
      "#тревога #самопомощь",
    location: "",
    firstComment: "",
    altText: "Человек сидит у окна с чашкой, вид на город",
    imageUrls: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    ],
    publishDate: "2026-04-27",
    publishTime: "14:00",
    createdAt: "2026-04-24T10:00:00+03:00",
  },
  {
    id: "p12",
    clientId: "c1",
    clientReviewToken:
      "smmrv_12f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021223232",
    status: "in_review",
    postType: "feed",
    caption:
      "FAQ: можно ли сочетать ретинол и кислоты — отвечаем честно и по шагам.\n" +
      "#ретинол #уход",
    location: "Клиника «Volkova»",
    firstComment: "",
    altText: "Ряд флаконов с сыворотками на белой поверхности",
    imageUrls: [
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&q=80",
    ],
    publishDate: "2026-04-29",
    publishTime: "10:00",
    createdAt: "2026-04-24T13:00:00+03:00",
  },
  {
    id: "p13",
    clientId: "c1",
    clientReviewToken:
      "smmrv_13f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021223333",
    status: "scheduled",
    postType: "photo",
    caption:
      "До процедуры и через 7 дней: мягкое обновление текстуры без агрессии.\n" +
      "#косметология #результат",
    location: "",
    firstComment: "",
    altText: "Крупный план кожи после процедуры",
    imageUrls: [
      "https://images.unsplash.com/photo-1598440947619-c2b35fa7a596?w=800&q=80",
    ],
    publishDate: "2026-04-28",
    publishTime: "11:00",
    createdAt: "2026-04-22T09:00:00+03:00",
  },
  {
    id: "p14",
    clientId: "c3",
    clientReviewToken:
      "smmrv_14f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021223434",
    status: "scheduled",
    postType: "reels",
    caption:
      "Разминка за 40 секунд: плечи и грудной отдел перед жимом — сохраняйте в закладки.\n" +
      "#разминка #зал",
    location: "Зал «Орлов»",
    firstComment: "",
    altText: "Тренер показывает движение плечами",
    imageUrls: [
      "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80",
    ],
    publishDate: "2026-04-29",
    publishTime: "19:00",
    createdAt: "2026-04-23T20:00:00+03:00",
  },
  {
    id: "p15",
    clientId: "c4",
    clientReviewToken:
      "smmrv_15f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021223535",
    status: "draft",
    postType: "feed",
    caption:
      "Тренд: микроцемент в ванной — плюсы, минусы и для кого точно не зайдёт.",
    location: "",
    firstComment: "",
    altText: "Ванная комната в минималистичном стиле",
    imageUrls: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80",
    ],
    publishDate: "2026-05-04",
    publishTime: "15:00",
    createdAt: "2026-04-19T12:00:00+03:00",
  },
  {
    id: "p16",
    clientId: "c4",
    clientReviewToken:
      "smmrv_16f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021223636",
    status: "scheduled",
    postType: "feed",
    caption:
      "Как выбрать диван под маленькую гостиную: 3 ошибки, которые мы видим чаще всего.\n" +
      "#диван #гостиная",
    location: "",
    firstComment: "",
    altText: "Светлый диван и журнальный столик в гостиной",
    imageUrls: [
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
    ],
    publishDate: "2026-05-01",
    publishTime: "10:00",
    createdAt: "2026-04-23T15:30:00+03:00",
  },
  {
    id: "p17",
    clientId: "c2",
    clientReviewToken:
      "smmrv_17f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021223737",
    status: "scheduled",
    postType: "reels",
    caption:
      "Субботний бранч: яйца пашот, ржаной тост и кофе — рецепт от шефа за 20 секунд.\n" +
      "#бранч #спб",
    location: "",
    firstComment: "",
    altText: "Тарелка с яйцами пашот и тостами",
    imageUrls: [
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&q=80",
    ],
    publishDate: "2026-05-03",
    publishTime: "12:00",
    createdAt: "2026-04-24T07:00:00+03:00",
  },
  {
    id: "p18",
    clientId: "c5",
    clientReviewToken:
      "smmrv_18f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021223838",
    status: "in_review",
    postType: "photo",
    caption:
      "Анонс эфира в четверг: отвечаем на вопросы про выгорание и границы на работе.",
    location: "",
    firstComment: "",
    altText: "Ноутбук и блокнот на столе, мягкий свет лампы",
    imageUrls: [
      "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=800&q=80",
    ],
    publishDate: "2026-05-07",
    publishTime: "19:30",
    createdAt: "2026-04-24T12:40:00+03:00",
  },
  {
    id: "p19",
    clientId: "c3",
    clientReviewToken:
      "smmrv_19f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021223939",
    status: "draft",
    postType: "stories",
    caption:
      "Опрос: вечерняя тренировка — до ужина или после?",
    location: "",
    firstComment: "",
    altText: "Смартфон с опросом в руке в зале",
    imageUrls: [
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
    ],
    publishDate: "2026-05-09",
    publishTime: "20:00",
    createdAt: "2026-04-18T10:00:00+03:00",
  },
  {
    id: "p20",
    clientId: "c5",
    clientReviewToken:
      "smmrv_20f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021224040",
    status: "scheduled",
    postType: "stories",
    caption:
      "Напоминание: запись на группу поддержки открыта до пятницы — ссылка в шапке профиля.",
    location: "",
    firstComment: "",
    altText: "Спокойный абстрактный фон с мягкими цветами",
    imageUrls: [
      "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&q=80",
    ],
    publishDate: "2026-05-10",
    publishTime: "09:00",
    createdAt: "2026-04-22T18:00:00+03:00",
  },
  {
    id: "p21",
    clientId: "c2",
    clientReviewToken:
      "smmrv_21f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021224141",
    status: "draft",
    postType: "feed",
    caption:
      "Новая карта напитков: безалкогольные коктейли на основе холодного чая — пробуйте первыми.",
    location: "",
    firstComment: "",
    altText: "Ряд стаканов с цветными напитками на барной стойке",
    imageUrls: [
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80",
    ],
    publishDate: "2026-05-11",
    publishTime: "13:00",
    createdAt: "2026-04-17T09:00:00+03:00",
  },
  {
    id: "p22",
    clientId: "c1",
    clientReviewToken:
      "smmrv_22f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021224242",
    status: "in_review",
    postType: "photo",
    caption:
      "Весенний уход: SPF каждый день — даже если «солнца не видно». Коротко, почему так.",
    location: "",
    firstComment: "",
    altText: "Тюбик солнцезащитного крема в руке на фоне окна",
    imageUrls: [
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
    ],
    publishDate: "2026-05-02",
    publishTime: "09:00",
    createdAt: "2026-04-24T16:05:00+03:00",
  },
  {
    id: "p23",
    clientId: "c2",
    clientReviewToken:
      "smmrv_23f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021224343",
    status: "published",
    postType: "feed",
    caption:
      "Понедельник без кофе не начинаем: фильтр Кения + печенье с шоколадом — до 12:00 скидка 10%.\n" +
      "#brewcorner #спб",
    location: "Brew Corner",
    firstComment: "",
    altText: "Чашка фильтр-кофе и печенье на блюдце",
    imageUrls: [
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
    ],
    publishDate: "2026-04-22",
    publishTime: "10:00",
    createdAt: "2026-04-21T08:00:00+03:00",
  },
  {
    id: "p24",
    clientId: "c1",
    clientReviewToken:
      "smmrv_24f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021224444",
    status: "published",
    postType: "photo",
    caption:
      "Результат недели: барьер + лёгкий пилинг — кожа ровнее, без агрессии. Спасибо, что доверяете процессу.\n" +
      "#косметология #результат",
    location: "",
    firstComment: "",
    altText: "Спокойный портрет у окна, мягкий дневной свет",
    imageUrls: [
      "https://images.unsplash.com/photo-1616394584738-fc6e612e71b1?w=800&q=80",
    ],
    publishDate: "2026-04-24",
    publishTime: "09:30",
    createdAt: "2026-04-23T17:00:00+03:00",
  },
  {
    id: "p25",
    clientId: "c4",
    clientReviewToken:
      "smmrv_25f1a2b3c4d5e6f70809101112131415161718191a1b1c1d1e1f2021224545",
    status: "rejected",
    postType: "reels",
    caption:
      "Тур по шоуруму: быстрый монтаж под музыку — клиент просил «как у конкурентов», но стиль не совпал с брендом.",
    location: "",
    firstComment: "",
    altText: "Интерьер шоурума, проход камеры по комнатам",
    imageUrls: [
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
    ],
    publishDate: "2026-04-23",
    publishTime: "15:00",
    createdAt: "2026-04-22T14:00:00+03:00",
  },
];

export const demoActivitiesFixture = [
  {
    id: "act-01",
    kind: "client_comment",
    createdAtMs: MOCK_DISCUSSION_REF_MS - 11 * 60 * 1000,
    title: "Клиент оставил комментарий к посту",
    detail: "Ирина Волкова: про хэштеги и оттенок в подписи",
    clientId: "c1",
    postId: "p1",
  },
  {
    id: "act-02",
    kind: "client_approval",
    createdAtMs: MOCK_DISCUSSION_REF_MS - 38 * 60 * 1000,
    title: "Клиент одобрил пост",
    detail: "Рилс для Brew Corner — финал с лого без текста",
    clientId: "c2",
    postId: "p2",
  },
  {
    id: "act-03",
    kind: "post_published",
    createdAtMs: MOCK_DISCUSSION_REF_MS - 2 * H_MS,
    title: "Пост опубликован в Instagram",
    detail: "Карусель «Городская кофейня» — сезонный напиток",
    clientId: "c2",
  },
  {
    id: "act-04",
    kind: "client_rejection",
    createdAtMs: MOCK_DISCUSSION_REF_MS - 3 * H_MS - 20 * 60 * 1000,
    title: "Клиент отклонил вариант",
    detail: "Студия «Линия»: не подходит тон первого кадра — ждём переделку",
    clientId: "c4",
    postId: "p9",
  },
  {
    id: "act-05",
    kind: "post_scheduled",
    createdAtMs: MOCK_DISCUSSION_REF_MS - 5 * H_MS,
    title: "Пост поставлен в расписание",
    detail: "Елена Соколова — сторис на пятницу 09:00",
    clientId: "c5",
    postId: "p20",
  },
  {
    id: "act-06",
    kind: "client_comment",
    createdAtMs: MOCK_DISCUSSION_REF_MS - 6 * H_MS - 15 * 60 * 1000,
    title: "Новый комментарий по согласованию",
    detail: "Максим Орлов: уточнение по таймингу рилса",
    clientId: "c3",
    postId: "p14",
  },
  {
    id: "act-07",
    kind: "client_added",
    createdAtMs: MOCK_DISCUSSION_REF_MS - 26 * H_MS,
    title: "Добавлен новый клиент",
    detail: "Елена Соколова (@elena_psy_talk) — психология, личный бренд",
    clientId: "c5",
  },
  {
    id: "act-08",
    kind: "post_published",
    createdAtMs: MOCK_DISCUSSION_REF_MS - 28 * H_MS,
    title: "Пост опубликован в Instagram",
    detail: "Ирина Волкова — уходовый чек-лист на неделю",
    clientId: "c1",
  },
  {
    id: "act-09",
    kind: "client_approval",
    createdAtMs: MOCK_DISCUSSION_REF_MS - 30 * H_MS,
    title: "Клиент одобрил пост",
    detail: "Студия «Линия» — до/после кухни 12 м²",
    clientId: "c4",
    postId: "p4",
  },
  {
    id: "act-10",
    kind: "post_scheduled",
    createdAtMs: MOCK_DISCUSSION_REF_MS - 32 * H_MS,
    title: "Пост поставлен в расписание",
    detail: "Орлов — разминка 40 секунд (рилс)",
    clientId: "c3",
    postId: "p14",
  },
];
