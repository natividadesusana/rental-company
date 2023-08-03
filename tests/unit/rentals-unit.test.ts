import rentalsService from "../../src/services/rentals-service";
import rentalsRepository from "../../src/repositories/rentals-repository";
import usersRepository from "../../src/repositories/users-repository";
import moviesRepository from "../../src/repositories/movies-repository";
import { notFoundError } from "../../src/errors/notfound-error";
import { Movie, Rental, User } from "@prisma/client";
import { buildUserInput } from "../factories/users-factory";
import { buildRentalReturn } from "../factories/rental-factory";
import { buildMovieInput } from "../factories/movie-factory";

describe("Rentals Service Unit Tests", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  })

  describe("get rentals tests", () => {
    it("should return rentals", async () => {
      jest.spyOn(rentalsRepository, "getRentals").mockResolvedValueOnce([
        { id: 1, closed: false, date: new Date(), endDate: new Date(), userId: 1 },
        { id: 2, closed: false, date: new Date(), endDate: new Date(), userId: 1 }
      ]);

      const rentals = await rentalsService.getRentals();
      expect(rentals).toHaveLength(2);
    });

    it("should return a specific rental", async () => {
      const mockRental: Rental & { movies: Movie[] } = {
        id: 1,
        closed: false,
        date: new Date(),
        endDate: new Date(),
        userId: 1,
        movies: [
          {
            id: 1,
            adultsOnly: true,
            name: "Crazy Adventure",
            rentalId: 1
          }
        ]
      }
      jest.spyOn(rentalsRepository, "getRentalById").mockResolvedValueOnce(mockRental);
      const rental = await rentalsService.getRentalById(1);
      expect(rental).toEqual(mockRental)
    })

    it("should return notFoundError when specific rental is not found", async () => {
      jest.spyOn(rentalsRepository, "getRentalById").mockResolvedValueOnce(null);
      const promise = rentalsService.getRentalById(1);
      expect(promise).rejects.toEqual(notFoundError("Rental not found."))
    });
  })

  describe("create rentals tests", () => {
    it("should throw an error when user does not exist", async () => {
      jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(null);
      const promise = rentalsService.createRental({
        userId: 1,
        moviesId: [1, 2, 3, 4]
      });
      expect(promise).rejects.toEqual({
        name: "NotFoundError",
        message: "User not found."
      })
    });

    it("should throw an error when user already have a rental", async () => {
      const mockUser: User = { id: 1, ...buildUserInput(true) }
      const userRental: Rental = buildRentalReturn(1, true);

      jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(mockUser);
      jest.spyOn(rentalsRepository, "getRentalsByUserId").mockResolvedValue([userRental]);

      const promise = rentalsService.createRental({
        userId: userRental.id,
        moviesId: [4, 5, 6, 7] // made up values
      });
      expect(promise).rejects.toEqual({
        name: "PendentRentalError",
        message: "The user already have a rental!"
      })
    })

    it("should throw an error when a minor user wants to rent a adults only movie", async () => {
      const mockUser: User = { id: 1, ...buildUserInput(false) }
      const mockMovie: Movie = {
        id: 1,
        rentalId: null,
        ...buildMovieInput(true)
      }

      jest.spyOn(usersRepository, "getById").mockResolvedValue(mockUser);
      jest.spyOn(rentalsRepository, "getRentalsByUserId").mockResolvedValue([]);
      jest.spyOn(moviesRepository, "getById").mockResolvedValue(mockMovie);

      const promise = rentalsService.createRental({
        userId: mockUser.id,
        moviesId: [1]
      });

      expect(promise).rejects.toEqual({
        name: "InsufficientAgeError",
        message: "Cannot see that movie."
      });
    });

    it("should throw an error when movie does not exist", async () => {
      const mockUser: User = { id: 1, ...buildUserInput(true) }

      jest.spyOn(usersRepository, "getById").mockResolvedValue(mockUser);
      jest.spyOn(rentalsRepository, "getRentalsByUserId").mockResolvedValue([]);
      jest.spyOn(moviesRepository, "getById").mockResolvedValue(null);

      const promise = rentalsService.createRental({
        userId: mockUser.id,
        moviesId: [1]
      });

      expect(promise).rejects.toEqual({
        name: "NotFoundError",
        message: "Movie not found."
      });
    });

    it("should throw an error when movie is not available", async () => {
      const mockUser: User = { id: 1, ...buildUserInput(true) }
      const mockMovie: Movie = {
        id: 1,
        rentalId: 1,
        ...buildMovieInput(true)
      }


      jest.spyOn(usersRepository, "getById").mockResolvedValue(mockUser);
      jest.spyOn(rentalsRepository, "getRentalsByUserId").mockResolvedValue([]);
      jest.spyOn(moviesRepository, "getById").mockResolvedValue(mockMovie);

      const promise = rentalsService.createRental({
        userId: mockUser.id,
        moviesId: [1]
      });

      expect(promise).rejects.toEqual({
        name: "MovieInRentalError",
        message: "Movie already in a rental."
      });
    });

    it("should do a rental for a movie", async () => {
      const mockUser: User = { id: 1, ...buildUserInput(true) }
      const mockMovie: Movie = {
        id: 1,
        rentalId: null,
        ...buildMovieInput(true)
      };

      jest.spyOn(usersRepository, "getById").mockResolvedValue(mockUser);
      jest.spyOn(rentalsRepository, "getRentalsByUserId").mockResolvedValue([]);
      jest.spyOn(moviesRepository, "getById").mockResolvedValue(mockMovie);
      jest.spyOn(rentalsRepository, "createRental").mockResolvedValue(null);

      await rentalsService.createRental({
        userId: mockUser.id,
        moviesId: [1]
      });
    })

  })

  describe("finish rentals tests", () => {
    it("should throw an error if rental does not exists", async () => {
      jest.spyOn(rentalsRepository, "getRentalById").mockResolvedValue(null)
      const promise = rentalsService.finishRental(1);
      expect(promise).rejects.toEqual({
        name: "NotFoundError",
        message: "Rental not found."
      });
    });

    it("should finish a rental", async () => {
      const mockRental: Rental & { movies: Movie[] } = {
        ...buildRentalReturn(1, false),
        movies: [
          {
            id: 1,
            rentalId: 1,
            ...buildMovieInput(true)
          }
        ]
      }
      jest.spyOn(rentalsRepository, "getRentalById").mockResolvedValue(mockRental);
      jest.spyOn(rentalsRepository, "finishRental").mockResolvedValue();
      await rentalsService.finishRental(1);
    })
  })

})