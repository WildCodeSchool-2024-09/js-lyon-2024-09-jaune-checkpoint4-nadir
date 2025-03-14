import databaseClient from "../../../database/client";

import type { Result, Rows } from "../../../database/client";

type User = {
  firstname: string;
  lastname: string;
};

type Customer = {
  id: number;
  user: User;
};

type Task = {
  id: number;
  title: string;
  description: string;
  location: string;
  image: string | null;
  status: "open" | "assigned" | "completed" | "cancelled";
  selected_offer: number | null;
  category_id?: number;
  customer?: Customer;
};

class TaskRepository {
  // The C of CRUD - Create operation

  // // V1
  // async create(task: Omit<Task, "id">) {
  //   // Execute the SQL INSERT query to add a new item to the "task" table
  //   const [result] = await databaseClient.query<Result>(
  //     "insert into task (title, description, location, image, status, customer_id, category_id, tasker_id) values (?, ?, ?, ?, ?, ?, ?, ?)",
  //     [
  //       task.title,
  //       task.description,
  //       task.location,
  //       task.image,
  //       task.status,
  //       task.selected_offer,
  //       // task.customer, //à vérifier customer_id
  //       task.category_id,
  //     ],
  //   );

  //   // Return the ID of the newly inserted item
  //   return result.insertId;
  // }

  // V2
  async create(
    task: Omit<Task, "id" | "customer" | "selected_offer" | "status">,
  ) {
    // Execute the SQL INSERT query to add a new item to the "task" table
    const [result] = await databaseClient.query<Result>(
      "insert into task (title, description, location, image, status, customer_id, category_id) values (?, ?, ?, ?, 'open', 1, ?)",
      [
        task.title,
        task.description,
        task.location,
        task.image,
        task.category_id,
      ],
    );

    // Return the ID of the newly inserted item
    return result.insertId;
  }

  // The Rs of CRUD - Read operations

  // // First tests basic :
  // async read(id: number) {
  //   // Execute the SQL SELECT query to retrieve a specific item by its ID
  //   const [rows] = await databaseClient.query<Rows>(
  //     "select * from task where id = ?",
  //     [id],
  //   );

  //   // Return the first row of the result, which represents the item
  //   return rows[0] as Task;
  // }

  async read(id: number) {
    const [rows] = await databaseClient.query<Rows>(
      `
      SELECT task.*, user.firstname, user.lastname
      FROM task
      JOIN customer ON task.customer_id = customer.id
      JOIN user ON customer.user_id = user.id
      WHERE task.id = ?
    `,
      [id],
    );

    // Return the first row of the result, which represents the category
    if (!rows[0]) return null;

    const row = rows[0];
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      location: row.location,
      // image: row.image ? `${process.env.VITE_API_URL}${row.image}` : null,
      image: row.image,
      status: row.status,
      selected_offer: row.selected_offer,
      category_id: row.category_id,
      customer: {
        id: row.customer_id,
        user: {
          firstname: row.firstname,
          lastname: row.lastname,
        },
      },
    };
  }

  // First tests worked :
  // async readAll() {
  //   // Execute the SQL SELECT query to retrieve all items from the "item" table
  //   const [rows] = await databaseClient.query<Rows>("select * from task");

  //   // Return the array of items
  //   return rows as Task[];
  // }

  async readAll() {
    const [rows] = await databaseClient.query<Rows>(`
      SELECT task.*, user.firstname, user.lastname, category.name as category_name
      FROM task
      JOIN customer ON task.customer_id = customer.id
      JOIN user ON customer.user_id = user.id
      JOIN category ON task.category_id = category.id
      ORDER BY task.id DESC
    `);
    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      location: row.location,
      // image: row.image ? `${process.env.VITE_API_URL}${row.image}` : null,
      image: row.image,
      status: row.status,
      selected_offer: row.selected_offer,
      category_id: row.category_id,
      category_name: row.category_name,
      customer: {
        id: row.customer_id,
        user: {
          firstname: row.firstname,
          lastname: row.lastname,
        },
      },
    }));
  }

  // The U of CRUD - Update operation
  // TODO: Implement the update operation to modify an existing item

  async update(
    task: Pick<
      Task,
      "id" | "title" | "description" | "location" | "category_id"
    >,
  ) {
    // Execute the SQL UPDATE query to update an existing category in the "category" table
    const [result] = await databaseClient.query<Result>(
      "update task set title = ?, description = ?, location = ?, category_id = ? where id = ?",
      [task.title, task.description, task.location, task.category_id, task.id],
    );

    // Return how many rows were affected
    return result.affectedRows;
  }

  // The D of CRUD - Delete operation
  // TODO: Implement the delete operation to remove an item by its ID

  async delete(id: number) {
    const [result] = await databaseClient.query<Result>(
      "DELETE FROM task WHERE id = ?",
      [id],
    );

    return result.affectedRows;
  }
  // }
}

export default new TaskRepository();
