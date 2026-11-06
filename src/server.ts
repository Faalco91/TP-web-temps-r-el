import express from "express";
import { db } from "./database.js";
import type { User, Product, Order, Status } from "./types.js";
import "./database.js";


const app = express();
let queue: Promise<unknown> = Promise.resolve();

app.use(express.json());



app.get("/", (req, res) => {
  res.send("Salut");
});

app.post<Record<string, never>, unknown, unknown>("/orders", (req, res, next) => {
  queue = queue.then(async () => {
    const body = req.body;

    if (
      typeof body !== "object" ||
      body === null ||
      !("userId" in body) ||
      !("productId" in body) ||
      !("quantity" in body)
    ) {
      return res.status(400).json({ error: "Champs manquants ou invalides" });
    }

    const { userId, productId, quantity } = body;

    if (
      typeof userId !== "number" ||
      typeof productId !== "number" ||
      typeof quantity !== "number" ||
      ![userId, productId, quantity].every(
        value => Number.isSafeInteger(value) && value > 0
      )
    ) {
      return res.status(400).json({ error: "Les champs doivent être des entiers positifs" });
    }

    const data = await db.getObject<{
      users: User[];
      products: Product[];
      orders: Order[];
    }>("/");

    const user = data.users.find(user => user.id === userId);

    if (!user) {
      return res.status(404).json({ error: "Client introuvable" });
    }

    const product = data.products.find(product => product.id === productId);

    if (!product) {
      return res.status(404).json({ error: "Produit introuvable" });
    }

    if (product.stock < quantity) {
      return res.status(409).json({ error: "Stock insuffisant" });
    }

    const order: Order = {
      id: Math.max(0, ...data.orders.map(order => order.id)) + 1,
      userId,
      productId,
      quantity,
      status: "preparing",
      createdAt: new Date().toISOString()
    };

    product.stock -= quantity;
    data.orders.push(order);

    await db.push("/", data);

    return res.status(201).json(order);
  }).catch(next);
});

const transitions: Partial<Record<Status, Status>> = {
  preparing: "shipped",
  shipped: "delivered"
};

app.patch<{ id: string }, unknown, unknown>(
  "/orders/:id/status",
  (req, res, next) => {
    queue = queue.then(async () => {
      const id = Number(req.params.id);
      const body = req.body;

      if (
        !/^[1-9]\d*$/.test(req.params.id) ||
        !Number.isSafeInteger(id)
      ) {
        return res.status(400).json({ error: "Identifiant invalide" });
      }

      if (
        typeof body !== "object" ||
        body === null ||
        !("status" in body) ||
        typeof body.status !== "string" ||
        !["preparing", "shipped", "delivered", "cancelled"].includes(body.status)
      ) {
        return res.status(400).json({ error: "désolé statut manquant ou invalide.." });
      }

      const orders = await db.getObject<Order[]>("/orders");
      const order = orders.find(order => order.id === id);

      if (!order) {
        return res.status(404).json({ error: "Commande introuvable" });
      }

      const nextStatus = transitions[order.status];

      if (!nextStatus || body.status !== nextStatus) {
        return res.status(409).json({ error: "Transition interdite" });
      }

      order.status = nextStatus;

      await db.push("/orders", orders);

      return res.status(200).json(order);
    }).catch(next);
  }
);

app.listen(3000);