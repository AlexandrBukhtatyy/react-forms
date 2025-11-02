import CopyrightWarning from '../components/CopyrightWarning';
import { screen, setup } from './TestUtils';

describe('GIVEN the CopyrightWarning', () => {
  it('THEN the copyright text should be displayed as expected', () => {
    setup(<CopyrightWarning />);

    const currentYear = new Date().getFullYear();

    const copyrightMessage = `© [${currentYear}] The Art Institute of Chicago. All rights reserved.`;

    const copyrightMessageElement = screen.getByRole('paragraph');

    expect(copyrightMessageElement).toHaveTextContent(copyrightMessage);
  });
});
