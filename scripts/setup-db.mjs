import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'autoflow.db');
const db = new Database(dbPath);

console.log('Создание таблиц...');

db.exec(`
  DROP TABLE IF EXISTS orders;
  DROP TABLE IF EXISTS cars;
  DROP TABLE IF EXISTS clients;
  DROP TABLE IF EXISTS users;

  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL
  );

  CREATE TABLE cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    plate TEXT NOT NULL,
    FOREIGN KEY(client_id) REFERENCES clients(id)
  );

  CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL,
    car_id INTEGER NOT NULL,
    mechanic_id INTEGER,
    problem TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    price INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(client_id) REFERENCES clients(id),
    FOREIGN KEY(car_id) REFERENCES cars(id),
    FOREIGN KEY(mechanic_id) REFERENCES users(id)
  );
`);

console.log('Добавление тестовых данных...');

// Вставляем пользователей
const insertUser = db.prepare('INSERT INTO users (username, password, role, name) VALUES (?, ?, ?, ?)');
// В реальности пароли нужно хэшировать. Для простоты прототипа оставим открытыми, или используем простые.
const managerId = insertUser.run('manager', '123', 'manager', 'Мээрим').lastInsertRowid;
const mechanic1Id = insertUser.run('mechanic1', '123', 'mechanic', 'Нурлан').lastInsertRowid;
const mechanic2Id = insertUser.run('mechanic2', '123', 'mechanic', 'Бакыт').lastInsertRowid;

// Вставляем клиентов
const insertClient = db.prepare('INSERT INTO clients (name, phone) VALUES (?, ?)');
const client1Id = insertClient.run('Айбек', '+996 772 123 456').lastInsertRowid;
const client2Id = insertClient.run('Гульзат', '+996 555 987 654').lastInsertRowid;

// Вставляем автомобили
const insertCar = db.prepare('INSERT INTO cars (client_id, brand, model, plate) VALUES (?, ?, ?, ?)');
const car1Id = insertCar.run(client1Id, 'Toyota', 'Camry', '01KG123ABC').lastInsertRowid;
const car2Id = insertCar.run(client2Id, 'Honda', 'Fit', '08KG456DEF').lastInsertRowid;

// Вставляем заказы
const insertOrder = db.prepare('INSERT INTO orders (client_id, car_id, mechanic_id, problem, status, price) VALUES (?, ?, ?, ?, ?, ?)');
insertOrder.run(client1Id, car1Id, mechanic1Id, 'Мотордон үн чыгып жатат (Стук в двигателе)', 'in_progress', 15000);
insertOrder.run(client2Id, car2Id, null, 'Май алмаштыруу керек (Замена масла)', 'new', 2500);
insertOrder.run(client1Id, car1Id, mechanic2Id, 'Ходовканы текшерүү (Проверка ходовой)', 'done', 8000);

console.log('База данных успешно инициализирована!');
db.close();
