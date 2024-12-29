import React, { useEffect, useState } from 'react';
import { UserWarning } from './UserWarning';
import * as todoService from './api/todos';
import { Todo } from './types/Todo';
import { TodoFooter } from './Components/Footer';
import { TodoHeader } from './Components/Header';
import { TodoMain } from './Components/Main';
import { ErrorNotifications } from './Components/Errors';
import { Filter } from './types/Filter';

function filterTodos(list: Todo[], filterWord: Filter) {
  switch (filterWord) {
    case Filter.All:
      return list;
    case Filter.Active:
      return list.filter(todo => !todo.completed);
    case Filter.Completed:
      return list.filter(todo => todo.completed);
    default:
      return list;
  }
}

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState(Filter.All);
  const [errorMessage, setErrorMessage] = useState('');
  const [processing, setProcessing] = useState<number | undefined>(undefined);
  const [todosQuantity, setTodosQuantity] = useState(0);

  useEffect(() => {
    setErrorMessage('');

    todoService
      .getTodos()
      .then(todosFromServer => {
        setTodos(todosFromServer);
        setTodosQuantity(
          todosFromServer.filter(todo => !todo.completed).length,
        );
      })
      .catch(err => {
        setErrorMessage('Unable to load todos');
        throw err;
      });
  }, []);

  function addTodo(newTodo: Todo) {
    setErrorMessage('');
    setProcessing(0);
    setTodos(currentTodos => [...currentTodos, newTodo]);

    return todoService
      .createTodo(newTodo)
      .then(todo => setTodos(currentTodos => [...currentTodos, todo]))
      .then(() =>
        setTodos(currentTodos => {
          currentTodos.splice(currentTodos.length - 2, 1);

          if (!newTodo.completed) {
            setTodosQuantity(todosQuantity + 1);
          }

          return currentTodos;
        }),
      )
      .catch(err => {
        setErrorMessage('Unable to add a todo');
        setTodos(currentTodos => {
          currentTodos.splice(currentTodos.length - 1, 1);

          return currentTodos;
        });
        throw err;
      })
      .finally(() => setProcessing(undefined));
  }

  function deleteTodo(todoId: number) {
    setErrorMessage('');
    setProcessing(todoId);

    return todoService
      .deleteTodo(todoId)
      .then(() =>
        setTodos(currentTodos => {
          const foundedTodo = currentTodos.find(todo => todoId === todo.id);

          if (!foundedTodo?.completed) {
            setTodosQuantity(todosQuantity - 1);
          }

          return currentTodos.filter(todo => todo.id !== todoId);
        }),
      )
      .catch(err => {
        setErrorMessage('Unable to delete a todo');
        throw err;
      })
      .finally(() => setProcessing(undefined));
  }

  const viewedTodos = filterTodos(todos, filter);

  if (!todoService.USER_ID) {
    return <UserWarning />;
  }

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <TodoHeader
          todos={todos}
          onAdd={addTodo}
          setError={setErrorMessage}
          processing={processing}
        />

        <section className="todoapp__main" data-cy="TodoList">
          {viewedTodos.map(todo => (
            <TodoMain
              todo={todo}
              onDelete={deleteTodo}
              processing={processing}
              key={todo.id}
            />
          ))}
        </section>

        {todos.length !== 0 && (
          <TodoFooter
            todosQuantity={todosQuantity}
            filter={filter}
            setFilter={setFilter}
            todos={todos}
            onDelete={deleteTodo}
          />
        )}
      </div>

      <ErrorNotifications error={errorMessage} setError={setErrorMessage} />
    </div>
  );
};
