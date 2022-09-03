/**
 * A TopBar partially based on Bulma's Navbar component.
 */
module.exports.topBar = html => ({
  title,
  titleClass = 'navbar-item is-size-5 has-text-info has-text-weight-bold',
  containerClass = '',
  endComponents = '',
  endComponentsClass = '',
  fixed = false
}) => {
  if (fixed) {
    document.body.classList.add('has-navbar-fixed-top');
  }
  return html`
    <nav class=${`navbar ${fixed ? 'is-fixed-top' : ''}`}>
      <div class=${`not-navbar-brand is-flex is-flex-grow-1 is-align-content-center ${containerClass}`}>
        <div class=${`not-navbar-brand is-flex is-flex-grow-1 ${titleClass}`}>${title}</div>
        <div class=${endComponentsClass}>${endComponents}</div>
      </div>
    </nav>
  `;
};
