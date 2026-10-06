export type UserLocation = {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp?: number;
};

export type ShopLocation = {
    codigo: string;
    tienda: string;
    calle: string;
    colonia: string;
    municipio: string;
    telefono: string;
    horario: string;
    latitud: string;
    longitud: string;
};

export type ShopsResponse = {
    tiendas: ShopLocation[];
};

export type MapLocation = {
    id: string;
    lat: number;
    lng: number;
    label?: string;
};
