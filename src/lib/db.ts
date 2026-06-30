export type User = { id: number, username: string, role: string, name: string };
export type Client = { id: number, name: string, phone: string };
export type Car = { id: number, client_id: number, brand: string, model: string, plate: string };
export type Order = { id: number, client_id: number, car_id: number, mechanic_id: number | null, problem: string, status: string, price: number, created_at: string };

const globalForDb = globalThis as unknown as { __db: any };

if (!globalForDb.__db) {
  globalForDb.__db = {
    users: [
      { id: 1, username: 'manager', role: 'manager', name: 'Мээрим' },
      { id: 2, username: 'mechanic1', role: 'mechanic', name: 'Нурлан' },
      { id: 3, username: 'mechanic2', role: 'mechanic', name: 'Бакыт' }
    ],
    clients: [
      { id: 1, name: 'Айбек', phone: '+996 772 123 456' },
      { id: 2, name: 'Гульзат', phone: '+996 555 987 654' }
    ],
    cars: [
      { id: 1, client_id: 1, brand: 'Toyota', model: 'Camry', plate: '01KG123ABC' },
      { id: 2, client_id: 2, brand: 'Honda', model: 'Fit', plate: '08KG456DEF' }
    ],
    orders: [
      { id: 1, client_id: 1, car_id: 1, mechanic_id: 2, problem: 'Мотордон үн чыгып жатат (Стук в двигателе)', status: 'in_progress', price: 15000, created_at: new Date().toISOString() },
      { id: 2, client_id: 2, car_id: 2, mechanic_id: null, problem: 'Май алмаштыруу керек (Замена масла)', status: 'new', price: 2500, created_at: new Date().toISOString() },
      { id: 3, client_id: 1, car_id: 1, mechanic_id: 3, problem: 'Ходовканы текшерүү (Проверка ходовой)', status: 'done', price: 8000, created_at: new Date().toISOString() }
    ],
    lastOrderId: 3,
    lastClientId: 2,
    lastCarId: 2,
  };
}

export const db = globalForDb.__db;
