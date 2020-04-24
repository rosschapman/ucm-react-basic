import { get as getUtil } from "./utils";
import { set as setUtil } from "./utils";

type InternalModel = {
  books: NormalizedResource<BookResource>;
  suggestedBooks: NormalizedResource<BookResource>;
};

let internalModel: InternalModel = {
  books: {
    byId: {},
    ids: []
  },
  suggestedBooks: {
    byId: {},
    ids: []
  }
};

let get = (path: string) => {
  return getUtil(internalModel, path);
};

let set = (path: string, newData: any) => {
  return setUtil(internalModel, path, newData);
};

let update = (type: string, data: any) => {
  let all = get(type);
  let onePath = `${type}.byId.${data.id}`;

  set(onePath, data);
  all.ids.push(data.id);
};

let updateAll = (type: string, data: any) => {
  set(type, data);
};

let findAll = (type: string) => {
  return get(`${type}.byId`);
};

let create = (initialData: InternalModel) => {
  console.info("model:initialized");
  internalModel = initialData;

  return {
    findAll,
    update,
    updateAll
  };
};

export const Model = {
  create
};
