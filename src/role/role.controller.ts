import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { RoleService } from './role.service';
import { CreateRoleDTO } from './dto/create.role.dto';

@Controller('role')
export class RoleController {
    constructor(
        private roleService: RoleService 
    ){}

    @Post()
    async createRole(@Body() createRoleDto: CreateRoleDTO){
        return await this.roleService.create(createRoleDto)
    }

    @Get(':id')
    async getRoleById(@Param('id', ParseUUIDPipe) id: string){
        return await this.roleService.getById(id)
    }
}
