export const sanitizePrice = (price: any) => {
    if (price == null) return "";

    if (typeof price == "string") {
        return price.replaceAll(",", "");
    }

    return `${price}`;
};