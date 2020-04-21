import React from "react";
import { Model } from "./model";
import { BookCourier } from "./api";

// Initial data
let store = {
  books: {
    byId: {},
    ids: []
  },
  suggestedBooks: {
    byId: {},
    ids: []
  }
};

// Types
// type UserActions = Record<keyof typeof userActions, UserAction>;
type FormConductorChildProps = {
  submitForm: (
    data: Action["payload"]
  ) => ReturnType<FormConductor["actionManager"]>;
  getModel: () => ReturnType<typeof Model.create>;
  userActions: { [k: string]: UserAction };
  status: Status;
};
type FormConductorProps = {
  children(childProps: FormConductorChildProps): React.ReactElement;
};
type Status = "IDLE" | "WAITING" | "HAS_DATA" | "HAS_ERROR" | "SUCCESS";
type UserAction = "SUBMIT_FORM";
type Action = {
  type: UserAction;
  payload: any;
};

// Conductor
class FormConductor extends React.Component<FormConductorProps> {
  readonly model = Model.create(store);
  readonly apiAdapater = { books: new BookCourier() };
  readonly userActions = {
    submitForm: "SUBMIT_FORM"
  };
  readonly statuses = {
    idle: "IDLE",
    waiting: "WAITING",
    success: "SUCCESS",
    hasData: "HAS_DATA",
    hasError: "HAS_ERROR"
  };
  status = this.statuses.idle;

  private statusMachine = (nextStatus: Status) => {
    switch (nextStatus) {
      case this.statuses.waiting:
        if (
          this.status === this.statuses.idle ||
          this.status === this.statuses.hasData ||
          this.status === this.statuses.hasError
        ) {
          this.status = nextStatus;
        }
      case this.statuses.hasData:
        if (this.status === this.statuses.success) {
          this.status = nextStatus;
        }
      case this.statuses.success:
        if (this.status === this.statuses.waiting) {
          this.status = nextStatus;
        }
      default:
        console.error("Logical fallacy achieved!");
    }

    this.forceUpdate();
  };

  private actionManager = async (action: Action) => {
    switch (action.type) {
      case "SUBMIT_FORM":
        // Update component status (sync)
        this.statusMachine(this.statuses.waiting as Status);
        // Post request (async)
        await this.apiAdapater.books.post(action.payload);
        this.statusMachine(this.statuses.success as Status);
        // Fetch request (async)
        let books = await this.apiAdapater.books.fetchAll();
        // Maybe fetch book suggestions
        if (books.length > 0) {
          this.statusMachine(this.statuses.waiting as Status);
          let suggestedBooks = await this.apiAdapater.books.suggest();
          this.statusMachine(this.statuses.success as Status);
          let normalized = suggestedBooks.reduce(
            (prev, next) => {
              let idCount = 0;
              prev.byId[idCount] = next;
              prev.ids.push(idCount);
              idCount++;
              return prev;
            },
            { byId: {}, ids: [] as number[] }
          );
          this.model.updateAll("suggestedBooks", normalized);
        }

        // Nomralize response (sync)
        let normalizedBooks = books.reduce(
          (prev, next) => {
            prev.byId[next.id] = next;
            prev.ids.push(next.id);
            return prev;
          },
          { byId: {}, ids: [] as number[] }
        );
        // Update model (sync)
        this.model.updateAll("books", normalizedBooks);
        // // Update component status (sync)
        this.statusMachine(this.statuses.hasData as Status);
        console.log("actionManager:SUBMIT_FORM:end");
        break;
      default:
        throw Error("It should be impossible to get here");
    }
  };

  private dispatch = (actionType: Action["type"]) => (
    data: Action["payload"]
  ) => {
    let action = {
      type: actionType,
      payload: data
    };

    return this.actionManager(action);
  };

  private getModel = () => {
    return this.model;
  };

  render() {
    let childProps = {
      submitForm: this.dispatch(this.userActions.submitForm as UserAction),
      getModel: this.getModel,
      userActions: this.userActions,
      status: this.status
    };

    return this.props.children(childProps as FormConductorChildProps);
  }
}

let Form = ({
  handleOnSubmit
}: {
  handleOnSubmit: ReturnType<FormConductor["dispatch"]>;
}) => (
  <React.Fragment>
    <h1>Add a book:</h1>
    <form
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault();
        let formData = new FormData(e.target as HTMLFormElement).entries();
        let serializedFormData = Object.fromEntries(formData);
        let fieldValues = Object.values(serializedFormData);
        let hasEmptyField = fieldValues.some(field => !field);

        if (hasEmptyField) {
          // TOOD: transition to error state
          console.warn("Missing form field value");
          return false;
        }

        return handleOnSubmit(serializedFormData);
      }}
    >
      <fieldset>
        <label htmlFor="title">
          <h6>Title:</h6>
          <input id="title" type="text" name="title" />
        </label>
        <label htmlFor="author">
          <h6>Author:</h6>
          <input id="author" type="text" name="author" />
        </label>
      </fieldset>
      <button className="button-primary" type="submit">
        Add Book
      </button>
    </form>
  </React.Fragment>
);

let BookList = ({
  books,
  suggestions
}: {
  books: BookResource[];
  suggestions: BookResource[];
}) =>
  books.length > 0 ? (
    <React.Fragment>
      <h1>My Books</h1>
      <ul>
        {books.map(book => (
          <li key={book.title}>
            {book.title} by {book.author}
          </li>
        ))}
      </ul>

      {suggestions.length && (
        <div style={{ background: "pink" }}>
          <p>
            You're such a voracious reader. Here are some other titles we think
            you'll love.
          </p>
          <ul>
            {suggestions.map(suggestion => (
              <li key={suggestion.title}>
                {suggestion.title} by {suggestion.author}
              </li>
            ))}
          </ul>
        </div>
      )}
    </React.Fragment>
  ) : (
    <React.Fragment>
      <h1>Book List</h1>
      <p>No books to display yet. Try adding some!</p>
    </React.Fragment>
  );

export default function App() {
  return (
    <FormConductor>
      {({ submitForm, getModel, userActions, status }) => {
        let model = getModel();
        // TODO: add selector?
        let books = Object.values(model.findAll("books")) as BookResource[];
        let suggestions = Object.values(
          model.findAll("suggestedBooks")
        ) as BookResource[];

        return (
          <React.Fragment>
            <BookList books={books} suggestions={suggestions} />
            <hr />
            <Form handleOnSubmit={submitForm} />
          </React.Fragment>
        );
      }}
    </FormConductor>
  );
}
