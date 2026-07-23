//Fichero del controlador de auth, este fichero contiene los metodos encargados
//  de conectar las peticiones con los casos de uso y devolver la respuesta
import { Request, Response } from "express";
import { GetCurrentUserUseCase } from "../../../application/auth/getCurrentUserUseCase";
import { LoginUserUseCase } from "../../../application/auth/loginUserUseCase";
import { RegisterUserUseCase } from "../../../application/auth/registerUserUseCase";
import { CreateGuestUserUseCase } from "../../../application/auth/createGuestUserUseCase";
import { AuthenticatedRequest } from "../types/authenticatedRequest";

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly createGuestUserUseCase: CreateGuestUserUseCase,
  ) {}

  async register(req: Request, res: Response): Promise<Response> {
    const user = await this.registerUserUseCase.execute({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  }

  async login(req: Request, res: Response): Promise<Response> {
    const result = await this.loginUserUseCase.execute({
      email: req.body.email,
      password: req.body.password,
    });

    return res.status(200).json(result);
  }

  async guest(_req: Request, res: Response): Promise<Response> {
    const result = await this.createGuestUserUseCase.execute();

    return res.status(201).json(result);
  }

  async me(req: Request, res: Response): Promise<Response> {
    const authenticatedReq = req as AuthenticatedRequest;

    const user = await this.getCurrentUserUseCase.execute({
      userId: authenticatedReq.user.userId,
    });

    return res.status(200).json({
      user,
    });
  }
}