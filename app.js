
const express = require("express"); // Importing express server for handling all http request and response
const { open } = require("sqlite"); // importing sqlite for database use 
const sqlite3 = require("sqlite3"); // importing sqlite for database driver
const path = require("path"); // importing path for making path of any file

// below _dirname is variable containing path of parent folder of current app.js
const databasePath = path.join(__dirname, "moviesData.db"); // making path for our database 

const app = express(); // here we are initialising app as a server

app.use(express.json()); // here express.json() is builtin middleware function to handle incoming request and response as json format 

let database = null; // we are initialising database connection object as null

// Defining the initializeDbAndServer function
const initializeDbAndServer = async () => {
  try {
      // connecting to database and now database has connection object string 
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    // assigning the port to app server for listening and displaying the connection message
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1); // forcely exit the process after getting error
  }
};
// calling the initializeDbAndServer() function
initializeDbAndServer();

// Function for Formatting the result to display in desired form
const convertMovieDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};

// Function for Formatting the result to display in desired form
const convertDirectorDbObjectToResponseObject = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

//API to get all movies from database 
app.get("/movies/", async (request, response) => {
    // writing Query to get all movies and this will pass as argument in database connection object methods
  const getMoviesQuery = `
    SELECT
      movie_name
    FROM
      movie;`;
  const moviesArray = await database.all(getMoviesQuery); // here we are passing the query to database.all() to get all movies list & finally assigning it to moviesArray Variable
  // now we are sending the movies array using formatted function as a response
  response.send(
    moviesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

//API to get single movies from database based on movieId passed by user as path parameter
app.get("/movies/:movieId/", async (request, response) => {
    // for movieId to be a parameter we must include :(colon) before it in url
    // we can extract parameters from request url by request.params
  const { movieId } = request.params;
  const getMovieQuery = `
    SELECT 
      *
    FROM 
      movie 
    WHERE 
      movie_id = ${movieId};`;
  const movie = await database.get(getMovieQuery);
  response.send(convertMovieDbObjectToResponseObject(movie));
});

//API to create movies in database
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const postMovieQuery = `
  INSERT INTO
    movie ( director_id, movie_name, lead_actor)
  VALUES
    (${directorId}, '${movieName}', '${leadActor}');`;
  await database.run(postMovieQuery);
  response.send("Movie Successfully Added");
});

//API to update single movies from database based on movieId passed by user as path parameter
app.put("/movies/:movieId/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const { movieId } = request.params;
  const updateMovieQuery = `
            UPDATE
              movie
            SET
              director_id = ${directorId},
              movie_name = '${movieName}',
              lead_actor = '${leadActor}'
            WHERE
              movie_id = ${movieId};`;

  await database.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//API to delete single movies from database based on movieId passed by user as path parameter
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
  DELETE FROM
    movie
  WHERE
    movie_id = ${movieId};`;
  await database.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//API to get all director from database 
app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
    SELECT
      *
    FROM
      director;`;
  const directorsArray = await database.all(getDirectorsQuery);
  response.send(
    directorsArray.map((eachDirector) =>
      convertDirectorDbObjectToResponseObject(eachDirector)
    )
  );
});

//API to get single director from database based on directorId passed by user as path parameter
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMoviesQuery = `
    SELECT
      movie_name
    FROM
      movie
    WHERE
      director_id='${directorId}';`;
  const moviesArray = await database.all(getDirectorMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

// Finally exporting app
module.exports = app;
