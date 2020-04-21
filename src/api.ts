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
      console.log("api:post:SUCCESS");
    });
  };

  fetchAll = () => {
    return promiseFactory<BookResource[]>(DB.books, () => {
      console.log("api:fetch:SUCCESS");
    });
  };

  // Sometimes a non-restful API is nice for a one-off!
  suggest = () => {
    let fakeResponse: Book[] = [
      { title: "Software Theory", author: "Frederica Frabetti" },
      { title: "Dreaming in Code", author: "Scott Rosenberg" }
    ];

    return promiseFactory<Book[]>(fakeResponse, () => {
      console.log("api:suggest:resolved");
    });
  };
}
