let DB = {
  books: [] as Book[]
};

let promiseFactory = <T>(data: any, cb: () => void) => {
  return new Promise<T>(resolve => {
    setTimeout(() => {
      cb();
      resolve(data);
    }, 500);
  });
};

export class BookCourier {
  idCount = 0;

  post = (data: Book) => {
    let nextData = {
      id: this.idCount++,
      ...data
    };

    return promiseFactory<BookResource[]>(nextData, () => {
      DB.books.push(nextData);
      console.info("api:post:SUCCESS");
    });
  };

  fetchAll = () => {
    let normalize = res =>
      res.reduce(
        (prev, next) => {
          prev.byId[next.id] = next;
          prev.ids.push(next.id);
          return prev;
        },
        { byId: {}, ids: [] as number[] }
      );
    return promiseFactory<BookResource[]>(DB.books, () => {
      console.info("api:fetch:SUCCESS");
    }).then(normalize);
  };

  // Sometimes a non-restful API is nice for a one-off!
  suggest = () => {
    let fakeResponse: Book[] = [
      { title: "Software Theory", author: "Frederica Frabetti" },
      { title: "Dreaming in Code", author: "Scott Rosenberg" }
    ];
    let normalize = res =>
      res.reduce(
        (prev, next, idx) => {
          prev.byId[idx] = next;
          prev.ids.push(idx);
          return prev;
        },
        { byId: {}, ids: [] as number[] }
      );

    return promiseFactory<Book[]>(fakeResponse, () => {
      console.info("api:suggest:resolved");
    }).then(normalize);
  };
}
