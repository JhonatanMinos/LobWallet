export type Promotion = {
    id: string | number;
    title: string;
    description?: string | null;
    image_url?: string | null;
    discount?: string | null;
    category?: string | null;
    store_code?: string | null;
    store_name?: string | null;
    valid_until?: string | null;
    cta_label?: string | null;
    cta_url?: string | null;
    active?: boolean;
};

export type PromotionsResponse = {
    promotions: Promotion[];
};
