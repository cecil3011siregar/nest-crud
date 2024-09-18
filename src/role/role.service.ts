import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository } from 'typeorm';
import { CreateRoleDTO } from './dto/create.role.dto';

@Injectable()
export class RoleService {
    constructor(
        @InjectRepository(Role)
        private roleRepository: Repository<Role>
    ){}

    async create(createRoleDto: CreateRoleDTO){
        const roleEntity = new Role()
        roleEntity.name = createRoleDto.name

        const result = await this.roleRepository.insert(roleEntity)

        return await this.roleRepository.findOneOrFail({
            where: {id : result.identifiers[0].id}
        })
    }


    async getById(id: string){
        const role = await this.roleRepository.findOneOrFail({
            where:{id}
        })
        return role
    }
}
