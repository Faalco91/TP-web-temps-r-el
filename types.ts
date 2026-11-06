type User = {
    id: number;
    name: string;
    username: string;
    email: string;
};

type Product = {
    id: number;
    name: string;
    stock: number; // quantité disponible
};

type Status = "preparing" | "shipped" | "delivered" | "cancelled";

type Order = {
    id: number;
    userId: User["id"]; // client qui commande
    productId: Product["id"]; // produit commandé
    quantity: number;
    status: Status;
    createdAt: string; // date au format ISO
};