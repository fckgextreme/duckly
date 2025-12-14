# Инструкция по деплою на VPS (Ubuntu)

## Подготовка VPS сервера

### 1. Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Установка Node.js (версия 20.x)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Проверка версии (должна быть 20.x)
```

### 3. Установка Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4. Установка PM2 (менеджер процессов)

```bash
sudo npm install -g pm2
```

### 5. Установка Git (если еще не установлен)

```bash
sudo apt install -y git
```

## Деплой приложения

### 1. Клонирование репозитория

```bash
cd /var/www
sudo mkdir -p duckkly
sudo chown $USER:$USER duckkly
cd duckkly
git clone <ваш-репозиторий> .
# Или загрузите файлы проекта другим способом
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка переменных окружения

```bash
cp env.example.txt .env
nano .env
```

Отредактируйте файл `.env` и укажите:
- `JWT_SECRET` - случайная строка для безопасности (минимум 32 символа)
- `EMAIL_USER` - ваш Gmail адрес
- `EMAIL_PASS` - пароль приложения Gmail (не обычный пароль!)
- `FRONTEND_URL` - `https://193.39.68.185` или ваш домен
- `BASE_URL` - `https://193.39.68.185` или ваш домен
- `NODE_ENV=production`

**Важно:** Для Gmail нужно создать пароль приложения:
1. Включите двухфакторную аутентификацию в Google аккаунте
2. Перейдите в настройки аккаунта → Безопасность → Пароли приложений
3. Создайте новый пароль приложения для "Почта"
4. Используйте этот пароль в `EMAIL_PASS`

### 4. Создание директорий для данных и логов

```bash
mkdir -p data/uploads logs
chmod 755 data data/uploads logs
```

### 5. Сборка проекта

```bash
npm run build
```

Эта команда:
- Скомпилирует TypeScript сервер в `dist-server/`
- Соберет Vue.js фронтенд в `dist/`

Структура после сборки:
- `dist-server/` - скомпилированный серверный код
- `dist/` - собранный фронтенд (HTML, CSS, JS)

### 6. Настройка PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Выполните команду, которую выведет PM2
```

### 7. Настройка Nginx

```bash
sudo cp nginx.conf /etc/nginx/sites-available/duckkly
sudo ln -s /etc/nginx/sites-available/duckkly /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default  # Удалите дефолтную конфигурацию, если не нужна
sudo nginx -t  # Проверка конфигурации
sudo systemctl reload nginx
```

### 8. Настройка файрвола (если используется UFW)

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (если будете использовать SSL)
sudo ufw enable
```

## Настройка SSL (опционально, но рекомендуется)

### Установка Certbot для Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 193.39.68.185
# Или если у вас есть домен:
# sudo certbot --nginx -d yourdomain.com
```

Certbot автоматически обновит конфигурацию Nginx для использования HTTPS.

## Обновление приложения

Когда нужно обновить приложение:

```bash
cd /var/www/duckkly
git pull  # или загрузите новые файлы
npm install
npm run build
pm2 restart duckkly
sudo systemctl reload nginx  # Перезагрузите Nginx, если изменили конфигурацию
```

## Полезные команды

### PM2

```bash
pm2 status              # Статус процессов
pm2 logs duckkly        # Логи приложения
pm2 restart duckkly     # Перезапуск
pm2 stop duckkly        # Остановка
pm2 delete duckkly      # Удаление из PM2
```

### Nginx

```bash
sudo systemctl status nginx    # Статус
sudo systemctl restart nginx  # Перезапуск
sudo nginx -t                  # Проверка конфигурации
sudo tail -f /var/log/nginx/duckkly-error.log  # Логи ошибок
```

### Проверка работы

```bash
# Проверка, что сервер запущен
curl http://localhost:8080/api/config

# Проверка через Nginx
curl http://193.39.68.185/api/config
```

## Решение проблем

### Приложение не запускается

1. Проверьте логи: `pm2 logs duckkly`
2. Проверьте, что порт 8080 свободен: `sudo netstat -tulpn | grep 8080` или `sudo ss -tulpn | grep 8080`
3. Проверьте переменные окружения в `.env`
4. Убедитесь, что сборка прошла успешно: проверьте наличие `dist-server/server.js` и `dist/index.html`

### Nginx возвращает 502 Bad Gateway

1. Проверьте, что Node.js сервер запущен: `pm2 status`
2. Проверьте логи Nginx: `sudo tail -f /var/log/nginx/duckkly-error.log`
3. Убедитесь, что сервер слушает на `localhost:8080`

### Проблемы с базой данных

1. Проверьте права доступа к директории `data/`: `ls -la data/`
2. Убедитесь, что директория существует и доступна для записи

### Проблемы с отправкой email

1. Проверьте, что используете пароль приложения Gmail, а не обычный пароль
2. Проверьте логи приложения на наличие ошибок отправки email

## Мониторинг

Для мониторинга ресурсов сервера:

```bash
pm2 monit  # Мониторинг PM2
htop       # Мониторинг системы (установите: sudo apt install htop)
```

## Резервное копирование

Рекомендуется настроить автоматическое резервное копирование базы данных:

```bash
# Создайте скрипт для бэкапа
nano /var/www/duckkly/backup.sh
```

Содержимое скрипта:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/duckkly"
mkdir -p $BACKUP_DIR
cp /var/www/duckkly/data/auth.db $BACKUP_DIR/auth_$(date +%Y%m%d_%H%M%S).db
# Удаление старых бэкапов (старше 7 дней)
find $BACKUP_DIR -name "auth_*.db" -mtime +7 -delete
```

Сделайте скрипт исполняемым и добавьте в cron:
```bash
chmod +x /var/www/duckkly/backup.sh
crontab -e
# Добавьте строку для ежедневного бэкапа в 3:00:
# 0 3 * * * /var/www/duckkly/backup.sh
```

