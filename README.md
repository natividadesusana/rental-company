# Rental Service

This is a rental service project that allows users to rent movies from a movie library. The project includes various functionalities to handle rentals, ensuring business rules are followed. The system checks and enforces several limitations before allowing a rental to be created.

## Business Rules
1. User Limitations:
    * The user can only rent a minimum of 1 movie and a maximum of 4 movies.
    * The user cannot have any pending rentals (a rental with closed = false).
    * If the user is under 18 years old, they cannot rent any adult movies (adultsOnly = true).
2. Movie Limitations:
    * Each movie can only be rented if it is available (rentalId = null).
    * There is only one copy of each movie available in the library.
  
## API Endpoints
1. GET /rentals: Retrieve all rentals from the system.
2.	GET /rentals/:id: Retrieve a specific rental by its ID.
3.	POST /rentals: Create a new rental. The request body should contain the user ID and an array of movie IDs.
4.	POST /rentals/finish: Finish a rental. The request body should contain the rental ID to be closed.

## Usage
1. Clone the project repository.
2.	Install the required dependencies using npm install.
3.	Run the server using npm start.
4.	Access the API endpoints using the appropriate HTTP methods.

## Test
The project comes with a suite of integration and unit tests to validate that the rental service follows the business rules correctly. The tests cover scenarios like renting multiple movies, underage user restrictions, movie availability, and more.

To run the tests:

1. Make sure the server is not running.
2.	Run the tests using the command: npm test.

## User Factory
The project includes a user factory to easily generate user data. You can use this factory to create users for testing the rental service.

Example usage:

    import { buildUser } from "./user-factory";
    const adultUser = await buildUser(true); // Generates an adult user.
    const minorUser = await buildUser(false); // Generates a minor user.

Please note that this project uses a mock library called "faker" to generate random user data for testing purposes.

## Libraries Used

The project utilizes the following libraries:
* Express.js: A lightweight web framework for handling HTTP requests.
* Prisma: An ORM for communicating with the database.
* Faker: A library for generating random data for testing purposes.

## Contributing
If you'd like to contribute to this project, feel free to fork the repository and create a pull request with your changes.


