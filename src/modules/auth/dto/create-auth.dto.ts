import { MaxLength, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class SignInInput {
  @IsNotEmpty()
  @MaxLength(25, {
    message: 'Max. length of 25 character for First Name',
  })
  firstName: string;

  @IsNotEmpty()
  @Matches(
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
    {
      message: 'Invalid email format',
    },
  )
  email: string;

  @MinLength(8, {
    message: 'Password min length is 8 characters',
  })
  @Matches(/(?=^.{8,}$)(?=.*\d)(?=.*[!$%^&()_+|~=`{}\[\]:";'<>?,.#@*-\/\\]*)(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password too weak.',
  })
  password: string;
}
