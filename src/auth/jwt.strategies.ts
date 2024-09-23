import { User } from "#/users/entities/user.entity";
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { InjectRepository } from "@nestjs/typeorm";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Repository } from "typeorm";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy){
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ){
        super({
            secretOrKey: 'key123',
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        })
    }


    async validate(payload: any){
        try{
            const user = await this.userRepository.findOne({
                where: {id: payload.id}
            })
            if(!user){
                throw new HttpException(
                    {
                        statusCode: HttpStatus.UNAUTHORIZED,
                        error: "unauthorized",
                    },
                    HttpStatus.UNAUTHORIZED
                )
            }
            return user
        }catch(e){
            throw e
        }
    }
}