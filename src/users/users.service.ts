import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { EntityNotFoundError, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RoleService } from '#/role/role.service';
import puppeteer from 'puppeteer';
import * as ExcelJS from 'exceljs';
import * as dayjs from 'dayjs';
import { Response } from 'express';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private roleService: RoleService
  ) {}

  async create(createUserDto: CreateUserDto) {
    // const findRole = await this.roleService.getById(createUserDto.roleId)

    const userEntity =  new User()
    userEntity.firstName = createUserDto.firstName
    userEntity.lastName = createUserDto.lastName
    userEntity.role_id = createUserDto.roleId
    const result = await this.usersRepository.insert(userEntity);
    return this.usersRepository.findOneOrFail({
      where: {
        id: result.identifiers[0].id,
      },
    });
  }

  findAll() {
    return this.usersRepository.findAndCount();
  }

  async findOne(id: string) {
    try {
      return await this.usersRepository.findOneOrFail({
        where: {
          id,
        },
        relations:{role:true}
      });
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Data not found',
          },
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw e;
      }
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      await this.usersRepository.findOneOrFail({
        where: {
          id,
        },
      });
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Data not found',
          },
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw e;
      }
    }

    await this.usersRepository.update(id, updateUserDto);

    return this.usersRepository.findOneOrFail({
      where: {
        id,
      },
    });
  }

  async remove(id: string) {
    try {
      await this.usersRepository.findOneOrFail({
        where: {
          id,
        },
      });
    } catch (e) {
      if (e instanceof EntityNotFoundError) {
        throw new HttpException(
          {
            statusCode: HttpStatus.NOT_FOUND,
            error: 'Data not found',
          },
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw e;
      }
    }

    await this.usersRepository.delete(id);
  }

  async generatePdf(date: string, options={}): Promise<Buffer>{
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--allow-file-access-from-files',  '--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 120000,
    });

    const dateString = new Date(date).toLocaleDateString('id-ID',{
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    } );

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(120000);
    const [user] = await this.findAll()
    const htmlTemplate = `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Afacad+Flux:wght@100..1000&family=Roboto+Slab:wght@100..900&display=swap');
        *{
            font-family: "Afacad Flux", sans-serif;
            font-weight: 400;
        }
        .container{
            padding:5px;
        }
        .title{
            text-align: center;
            font-weight: 600;
            margin: 0px;
        }
        .date{
            font-size: large;
            font-weight:400;
            text-align: center;
        }
        table{
            width:100%;
            margin-top: 40px;
            border-collapse: collapse;
        }
        th{
            width:auto;
            padding:2px;
            font-weight: 500;
        }
        td{
            padding:5px
        }
        .num{
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="title">List Active Users</h1>
        <div class="date">${dateString}</div>
        <div>
            <table border="1">
            <tr>
                  <th class="num-head">No</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Created At</th>
              </tr>
            ${user.map((item, i) => `
                <tr>
                    <td class="num">${i+1}</td>
                    <td>${item.firstName}</td>
                    <td>${item.lastName}</td>
                    <td>${new Date(item.createdAt).toLocaleDateString('en-GB')}</td>

                </tr>
              `).join('')}
            </table>
        </div>
    </div>
</body>
</html>
    `;
    await page.setContent(htmlTemplate,  { waitUntil: 'networkidle0', timeout: 120000 });
    const pdfUint8Array = await page.pdf({
      format: 'A4',
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      ...options,
  });

  await browser.close();

  return Buffer.from(pdfUint8Array);
  }

  async generateExcel(res: Response){
    const userData = await this.usersRepository.find({order: {createdAt: 'ASC'}});
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data Users');
    worksheet.columns=[
      {
        header: 'No',
        key: 'index',
        width: 30,
      },
      {
        header: 'Username',
        key: 'username',
        width: 30,
      },
      {
        header: 'Status',
        key: 'status',
        width: 30,
      },
      {
        header: 'Created At',
        key: 'createdAt',
        width: 30
      }
    ]
    userData.forEach((data, index) => {
      worksheet.addRow({
        index: index + 1,
        fullname: `${data.firstName} ${data.lastName}`,
        status: `${data.isActive ? 'Active' : 'Inactive'}`,
        createdAt: `${new Date(data.createdAt).toLocaleDateString('en-GB')}`
      })
    });

    // Generate file name with current date and time
    const today = dayjs().format('YYYYMMDDHHmmss');
    const filename = `data-users-${today}.xlsx`;

    const uint8Array = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.from(uint8Array);

    // Set response headers for file download
    res.header(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.header('Content-Disposition', `attachment; filename=${filename}`);

    // Send file buffer as response
    res.send(buffer);
  }
}
