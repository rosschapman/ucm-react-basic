// declare interface ObjectConstructor {
//   fromEntries(entries: IterableIterator<readonly [PropertyKey, any]>): {[k in PropertyKey]: any};
// }

// Utility types
type ValueOf<T extends Record<any, any>> = T[keyof T];

// Domain types
type BaseResource = { id: number };
type BookId = number & {
  _type: "Book";
};
type Book = {
  title: string;
  author: string;
};
type BookResource = Book & BaseResource;
type NormalizedResource<T> = {
  byId: { [k: number]: T };
  ids: number[];
};
