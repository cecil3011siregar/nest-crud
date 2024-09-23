import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RegisterDto } from './dto/create-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '#/users/entities/user.entity';
import { Repository } from 'typeorm';
import { RoleService } from '#/role/role.service';
import * as bcrypt from "bcrypt"
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login-auth.dto';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private roleService: RoleService,
    private jwtService: JwtService

  ){}
  async register(registerDto: RegisterDto) {
    try{
      const role = await this.roleService.getById(registerDto.role_id)
      //generate salt 
      const saltGenerate = await bcrypt.genSalt()

      //hashing password
      const hashPasword = await bcrypt.hash(registerDto.password, saltGenerate)

      const user =  new User()
      user.firstName = registerDto.first_name
      user.lastName = registerDto.last_name
      user.email = registerDto.email
      user.password = hashPasword
      user.salt = saltGenerate
      user.role_id = role.id

      const result = await this.userRepository.insert(user)
      return await this.userRepository.findOneOrFail({
        where:{id: result.identifiers[0].id}
      })

    }catch(e){
      throw e
    }
  }

  async login(loginDto: LoginDto){
    try{
      const findUser = await this.userRepository.findOne({
        where: {email: loginDto.email}
      })
      
      if(!findUser){
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            error: 'email not found',
          },
          HttpStatus.NOT_FOUND
        )
      }
      const role = await this.roleService.getById(findUser.role_id)

      const comparePassword = await bcrypt.compare(loginDto.password, findUser.password)

      if(!comparePassword){
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            error: 'password is invalid',
          },
          HttpStatus.BAD_REQUEST
        )
      }

      const payload = {
        id: findUser.id,
        firstName: findUser.firstName,
        role: role.name
      }

      return {
        access_token: await this.jwtService.sign(payload)  //create jwt token(bearer Token)
      }
    }catch(e){
      throw e
    }
  }
}
