import pool from "./db.js";

const testDB = async () => {
  try {
    const connection = await pool.getConnection();

    console.log("MySQL Connected Successfully");

    connection.release();
  } catch (error) {
    console.log("Database Connection Failed");
    console.log(error);
  }
};

testDB();