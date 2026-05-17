# Вязалка

MVP веб-приложения для вязальщиц: локальная цифровая тетрадь проектов с расчетом петель, рядов и прибавок/убавок.

## Возможности MVP

- создание и редактирование проекта “Базовый свитер / кофта снизу вверх”;
- ввод плотности вязания и мерок;
- расчет спинки, переда и рукава;
- автоматический план прибавок для рукава;
- отдельный калькулятор прибавок/убавок;
- локальное хранение в IndexedDB через Dexie;
- экспорт и импорт проекта в JSON;
- печать страницы результата через браузер.

## Команды

```bash
npm install
npm run dev
npm run test
npm run build
```

## Разработка

Расчетные формулы находятся в `src/shared/domain`. UI не содержит бизнес-формул напрямую. Доступ к проектам идет через интерфейс `ProjectRepository`, текущая реализация `LocalProjectRepository` использует IndexedDB. Позже можно добавить `ApiProjectRepository` и переключить источник данных без переписывания экранов.

## Деплой

Проект собирается как статическое Vite-приложение.

### Vercel

1. Подключите репозиторий.
2. Framework Preset: `Vite`.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.

### Netlify

1. New site from Git.
2. Build command: `npm run build`.
3. Publish directory: `dist`.

### Cloudflare Pages

1. Create a Pages project from Git.
2. Framework preset: `Vite`.
3. Build command: `npm run build`.
4. Build output directory: `dist`.
