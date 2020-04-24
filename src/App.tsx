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
type AppConductorChildProps = {
  submitForm: (
    data: Action["payload"]
  ) => ReturnType<AppConductor["actionManager"]>;
  getModel: () => ReturnType<typeof Model.create>;
  userActions: { [k: string]: UserAction };
  status: Status;
};
type AppConductorProps = {
  children(childProps: AppConductorChildProps): React.ReactElement;
};
type Status = "IDLE" | "WAITING" | "HAS_DATA" | "HAS_ERROR" | "SUCCESS";
type UserAction = "SUBMIT_FORM";
type UserActions = {
  [key: string]: UserAction;
};
type Action = {
  type: UserAction;
  payload: any;
};

// Conductor
class AppConductor extends React.Component<AppConductorProps> {
  readonly model = Model.create(store);
  readonly apiAdapater = { books: new BookCourier() };
  readonly userActions: UserActions = {
    submitForm: "SUBMIT_FORM"
  };
  readonly statuses = {
    idle: "IDLE",
    waiting: "WAITING",
    success: "SUCCESS",
    hasData: "HAS_DATA",
    hasError: "HAS_ERROR"
  };
  state = {
    status: this.statuses.idle
  };

  private processEntityCreate = async (payload: any) => {
    // Update component status (sync)
    this.stateMachine(this.statuses.waiting as Status);
    // Post request (async)
    await this.apiAdapater.books.post(payload);
    this.stateMachine(this.statuses.success as Status);
    // Fetch request (async)
    let books = await this.apiAdapater.books.fetchAll();
    // Maybe fetch book suggestions
    if (books.ids.length > 0) {
      this.stateMachine(this.statuses.waiting as Status);
      let suggestedBooks = await this.apiAdapater.books.suggest();
      this.stateMachine(this.statuses.success as Status);
      this.model.updateAll("suggestedBooks", suggestedBooks);
    }
    // Update model (sync)
    this.model.updateAll("books", books);
    // // Update component status (sync)
    this.stateMachine(this.statuses.hasData as Status);
  };

  private stateMachine = (nextStatus: Status) => {
    switch (nextStatus) {
      case this.statuses.waiting:
        if (
          this.state.status === this.statuses.idle ||
          this.state.status === this.statuses.hasData ||
          this.state.status === this.statuses.hasError
        ) {
          return this.setState({ status: nextStatus });
        }
      case this.statuses.hasData:
        if (this.state.status === this.statuses.success) {
          return this.setState({ status: nextStatus });
        }
      case this.statuses.success:
        if (this.state.status === this.statuses.waiting) {
          return this.setState({ status: nextStatus });
        }
      default:
        console.error("Logical fallacy achieved!");
    }
  };

  private actionDispatch = async (action: Action) => {
    switch (action.type) {
      case "SUBMIT_FORM":
        console.time("actionManager:SUBMIT_FORM");
        await this.processEntityCreate(action.payload);
        console.timeEnd("actionManager:SUBMIT_FORM");
        console.timeLog("actionManager:SUBMIT_FORM");
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

    return this.actionDispatch(action);
  };

  private getModel = () => {
    return this.model;
  };

  render() {
    let childProps = {
      submitForm: this.dispatch(this.userActions.submitForm),
      getModel: this.getModel,
      userActions: this.userActions,
      status: this.state.status
    };

    return this.props.children(childProps as AppConductorChildProps);
  }
}

let Form = ({
  handleOnSubmit
}: {
  handleOnSubmit: ReturnType<AppConductor["dispatch"]>;
}) => (
  <React.Fragment>
    <h4>Add a book:</h4>
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
      <h4>My Books</h4>
      <ul>
        {books.map(book => (
          <li key={book.title}>
            {book.title} by {book.author}
          </li>
        ))}
      </ul>

      {suggestions.length && (
        <React.Fragment>
          <p>
            <strong>
              You're such a voracious reader. Here are some other titles we
              think you'll love:
            </strong>
          </p>
          <ul>
            {suggestions.map(suggestion => (
              <li key={suggestion.title}>
                {suggestion.title} by {suggestion.author}
              </li>
            ))}
          </ul>
        </React.Fragment>
      )}
    </React.Fragment>
  ) : (
    <React.Fragment>
      <h4>Book List</h4>
      <p>No books to display yet. Try adding some!</p>
    </React.Fragment>
  );

export default function App() {
  return (
    <AppConductor>
      {({ submitForm, getModel, status }) => {
        let model = getModel();
        // TODO: add selector?
        let books = Object.values(model.findAll("books")) as BookResource[];
        let suggestions = Object.values(
          model.findAll("suggestedBooks")
        ) as BookResource[];

        return (
          <React.Fragment>
            <div className="u-pull-right">APP STATUS = {status}</div>
            <BookList books={books} suggestions={suggestions} />
            <hr />
            <Form handleOnSubmit={submitForm} />
          </React.Fragment>
        );
      }}
    </AppConductor>
  );
}
