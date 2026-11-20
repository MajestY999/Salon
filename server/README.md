# Локальный API салона

Демо-бэкенд на Express и Sequelize/SQLite. Не используйте его для реальных записей или хранения персональных данных.

## Как открыть и запустить

Папка проекта с `package.json` находится в `Salon/`. Если терминал открыт в `Desktop/salon`, сначала перейдите в папку проекта:

```sh
cd Salon
cd server
npm install
cp .env.example .env
npm start
```

Если терминал уже открыт в корне проекта `Salon/`, достаточно:

```sh
cd server
npm install
cp .env.example .env
npm start
```

Можно не менять текущую папку терминала и запустить из корня проекта:

```sh
npm run server
```

Сервер слушает `http://localhost:5001`; SQLite-файл `server/database.sqlite` создаётся автоматически. Для автоматического перезапуска при разработке из `server/` используйте `npm run dev`, из корня проекта — `npm run dev:server`.

Учётные данные по умолчанию: `admin` / `admin123`. Настройки `PORT`, `ADMIN_LOGIN`, `ADMIN_PASSWORD` и `DB_PATH` можно менять в локальном `server/.env`. Пример конфигурации находится в `.env.example`.

## API

- `GET /api/services`
- `GET /api/masters`
- `GET /api/masters/:id/slots?date=YYYY-MM-DD`
- `POST /api/appointments` с `masterId`, `serviceId`, `slot`, `name`, `phone` и необязательной `date`
- `POST /api/auth/login` с `login` и `password`
- `GET /api/admin/appointments` с `Authorization: Bearer <token>`
- `PATCH /api/admin/appointments/:id` с `status`: `Pending`, `Confirmed` или `Cancelled`
- `DELETE /api/admin/appointments/:id` и `DELETE /api/admin/appointments`
- `POST /api/admin/services`, `PATCH /api/admin/services/:id`, `DELETE /api/admin/services/:id`

Ошибки API возвращаются в формате `{ "error": "..." }`. Токен хранится только в памяти и сбрасывается при перезапуске.

Форма записи и раздел «Входящие» в админке используют этот API и SQLite. Услуги в админке также читаются и редактируются в базе. Расписание мастеров для демо сохраняется в `localStorage` браузера; при первом запуске выставлены рабочие дни и время 10:00–21:00.
