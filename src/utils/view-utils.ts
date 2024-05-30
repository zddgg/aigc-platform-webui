export const scrollToTop = (id: string) => {
  const targetElement = document.getElementById(id);
  if (targetElement) {
    targetElement.scrollIntoView({behavior: 'smooth'});
  }
};