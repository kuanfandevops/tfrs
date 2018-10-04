package pages

import geb.Page

import extensions.ReactJSAware

import modules.HeaderModule
import modules.ModalModule
import modules.FooterModule

/**
 * Base app page where global selectors and modules used by all pages can be added.
 *
 * All pages should extend this page.
 */
class BaseAppPage extends Page implements ReactJSAware {
  static content = {
    headerModule { module(HeaderModule) }
    modalModule { module(ModalModule) }
    footerModule { module(FooterModule) }
  }
}