import { JsonDB, Config } from "node-json-db";
import type { User, Product, Order } from "./types.js";

export const db = new JsonDB(new Config("data/db", true, false, "/"));

if (!(await db.exists("/users"))) {
    const users: User[] = [
        { id: 1, name: "Jon", username: "JonSnow", email: "jonsnow@gmail.com" },
        { id: 2, name: "Perreira", username: "Poatan", email: "perreira@gmail.com" },
    ];
    await db.push("/users", users);
}

if (!(await db.exists("/products"))) {
    const products: Product[] = [
        { id: 1, name: "Clavier", stock: 10 },
        { id: 2, name: "Souris", stock: 5 },
        { id: 3, name: "Ecran", stock: 20 },
    ];
    await db.push("/products", products);
}

if (!(await db.exists("/orders"))) {
    const orders: Order[] = [];
    await db.push("/orders", orders);
}
