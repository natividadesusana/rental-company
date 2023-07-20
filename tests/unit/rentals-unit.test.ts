import rentalsService from "../../src/services/rentals-service";
import rentalsRepository from "../../src/repositories/rentals-repository";
import usersRepository from "../../src/repositories/users-repository";
import moviesRepository from "../../src/repositories/movies-repository";
import { User } from "@prisma/client";

describe("Rentals Service Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const userMock: User = {
    id: 1,
    firstName: "Ana",
    lastName: "Silva",
    email: "ana@teste.com",
    cpf: "12345678901",
    birthDate: new Date("2000-01-01"),
  };

  it("should return rentals", async () => {
    jest.spyOn(rentalsRepository, "getRentals").mockResolvedValueOnce([
      {
        id: 1,
        closed: false,
        date: new Date(),
        endDate: new Date(),
        userId: 1,
      },
      {
        id: 2,
        closed: false,
        date: new Date(),
        endDate: new Date(),
        userId: 1,
      },
    ]);

    const rentals = await rentalsService.getRentals();
    expect(rentals).toHaveLength(2);
  });

  it("should prevent the user from renting invalid number of movies", async () => {
    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(userMock);
    jest
      .spyOn(rentalsRepository, "getRentalsByUserId")
      .mockResolvedValueOnce([]);

    jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce({
      id: 1,
      name: "Movie 1",
      rentalId: null,
      adultsOnly: false,
    });

    const invalidInputs = [
      { userId: 1, moviesId: [] },
      { userId: 1, moviesId: [1, 2, 3, 4, 5] },
    ];

    for (const rentalInput of invalidInputs) {
      try {
        await rentalsService.createRental(rentalInput);
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe("Please select at least 1 movie to rent.");
      }
    }
  });

  it("should prevent the user from renting adult movies if they are under 18 years old", async () => {
    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce({
      ...userMock,
      birthDate: new Date("2000-01-01"),
    });

    jest
      .spyOn(rentalsRepository, "getRentalsByUserId")
      .mockResolvedValueOnce([]);

    jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce({
      id: 1,
      name: "Adult Movie",
      rentalId: null,
      adultsOnly: true,
    });

    const rentalInput = { userId: 1, moviesId: [1] };

    try {
      await rentalsService.createRental(rentalInput);
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toBe(
        "Cannot rent adult movies if you are under 18 years old."
      );
    }
  });

  it("should prevent the user from renting a movie that is not available", async () => {
    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(userMock);
    jest
      .spyOn(rentalsRepository, "getRentalsByUserId")
      .mockResolvedValueOnce([]);

    jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce({
      id: 1,
      name: "Rented Movie",
      rentalId: 123,
      adultsOnly: false,
    });

    const rentalInput = { userId: 1, moviesId: [1] };

    try {
      await rentalsService.createRental(rentalInput);
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toBe(
        "Movie already in a rental."
      );
    }
  });

  it("should prevent the user from renting more than one unit of the same movie", async () => {
    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(userMock);
    jest
      .spyOn(rentalsRepository, "getRentalsByUserId")
      .mockResolvedValueOnce([]);

    const availableMovie = {
      id: 1,
      name: "Available Movie",
      rentalId: null,
      adultsOnly: false,
    };

    const userRentalWithSameMovie = [
      {
        id: 123,
        userId: 2,
        moviesId: [availableMovie.id],
        date: new Date(),
        endDate: new Date(),
        closed: false,
      },
    ];

    jest
      .spyOn(moviesRepository, "getById")
      .mockResolvedValueOnce(availableMovie);
    jest
      .spyOn(rentalsRepository, "getRentalsByUserId")
      .mockResolvedValueOnce(userRentalWithSameMovie);

    const rentalInput = { userId: 1, moviesId: [availableMovie.id] };

    try {
      await rentalsService.createRental(rentalInput);
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toBe(
        "Movie already in a rental."
      );
    }
  });

  it("should prevent the user from renting if they have pending rentals", async () => {
    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(userMock);
    jest
      .spyOn(rentalsRepository, "getRentalsByUserId")
      .mockResolvedValueOnce([
        {
          id: 1,
          closed: false,
          date: new Date(),
          endDate: new Date(),
          userId: 1,
        },
      ]);

    const rentalInput = { userId: 1, moviesId: [1] };

    try {
      await rentalsService.createRental(rentalInput);
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toBe("The user already have a rental!");
    }
  });

  it("should allow the user to rent if they have no pending rentals", async () => {
    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(userMock);
    jest
      .spyOn(rentalsRepository, "getRentalsByUserId")
      .mockResolvedValueOnce([]);

    jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce({
      id: 1,
      name: "Available Movie",
      rentalId: null,
      adultsOnly: false,
    });

    const rentalInput = { userId: 1, moviesId: [1] };

    await rentalsService.createRental(rentalInput);
    expect(true).toBe(true);
  });

  it("should prevent the user from renting a movie that was just rented by another user", async () => {
    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(userMock);
    jest
      .spyOn(rentalsRepository, "getRentalsByUserId")
      .mockResolvedValueOnce([]);

    jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce({
      id: 1,
      name: "Rented Movie",
      rentalId: 123,
      adultsOnly: false,
    });

    const rentalInput = { userId: 1, moviesId: [1] };

    try {
      await rentalsService.createRental(rentalInput);
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toBe(
        "Movie already in a rental."
      );
    }
  });

  it("should allow the user to rent a movie that was returned and now available", async () => {
    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(userMock);
    jest
      .spyOn(rentalsRepository, "getRentalsByUserId")
      .mockResolvedValueOnce([]);

    jest.spyOn(moviesRepository, "getById").mockResolvedValueOnce({
      id: 1,
      name: "Returned Movie",
      rentalId: null,
      adultsOnly: false,
    });

    const rentalInput = { userId: 1, moviesId: [1] };

    await rentalsService.createRental(rentalInput);
    expect(true).toBe(true);
  });

  it("should prevent the user from renting a movie that has already been rented by someone else", async () => {
    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(userMock);
    jest
      .spyOn(rentalsRepository, "getRentalsByUserId")
      .mockResolvedValueOnce([]);

    const availableMovie = {
      id: 1,
      name: "Available Movie",
      rentalId: null,
      adultsOnly: false,
    };

    const userRentalWithSameMovie = [
      {
        id: 123,
        userId: 2,
        moviesId: [availableMovie.id],
        date: new Date(),
        endDate: new Date(),
        closed: false,
      },
    ];

    jest
      .spyOn(moviesRepository, "getById")
      .mockResolvedValueOnce(availableMovie);
    jest
      .spyOn(rentalsRepository, "getRentalsByUserId")
      .mockResolvedValueOnce(userRentalWithSameMovie);

    const rentalInput = { userId: 1, moviesId: [availableMovie.id] };

    try {
      await rentalsService.createRental(rentalInput);
      expect(true).toBe(false);
    } catch (error) {
      expect(error.message).toBe(
        "Movie already in a rental."
      );
    }
  });

  it("should allow the user to rent a movie if it is available for rent", async () => {
    jest.spyOn(usersRepository, "getById").mockResolvedValueOnce(userMock);
    jest
      .spyOn(rentalsRepository, "getRentalsByUserId")
      .mockResolvedValueOnce([]);

    const availableMovie = {
      id: 1,
      name: "Available Movie",
      rentalId: null,
      adultsOnly: false,
    };
    jest
      .spyOn(moviesRepository, "getById")
      .mockResolvedValueOnce(availableMovie);

    const rentalInput = { userId: 1, moviesId: [availableMovie.id] };

    await rentalsService.createRental(rentalInput);
    expect(true).toBe(true);
  });
});
