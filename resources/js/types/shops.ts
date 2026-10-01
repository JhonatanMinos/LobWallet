export type UserLocation = {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
};

export interface ShopLocation {
    codigo: string;
    tienda: string;
    calle: string;
    colonia: string;
    municipio: string;
    telefono: string;
    horario: string;
    latitud: string;
    longitud: string;
}

export type ShopsResponse = {
    tiendas: ShopLocation[];
};
