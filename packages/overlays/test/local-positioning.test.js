import { expect, fixture, html } from '@open-wc/testing';
import { renderAsNode } from '@lion/core';
import Popper from 'popper.js/dist/esm/popper.min.js';
import { OverlayController } from '../src/OverlayController.js';
import { normalizeTransformStyle } from '../test-helpers/local-positioning-helpers.js';

const withLocalTestConfig = () => ({
  placementMode: 'local',
  contentNode: renderAsNode(html`
    <div>my content</div>
  `),
  invokerNode: renderAsNode(html`
    <div role="button" style="width: 100px; height: 20px;">Invoker</div>
  `),
});

describe('Local Positioning', () => {
  describe('Nodes', () => {
    // TODO: check if wanted/needed
    it.skip('sets display to inline-block for contentNode by default', async () => {
      const invokerNode = await fixture(html`
        <div role="button" id="invoker">Invoker</div>
      `);

      const node = document.createElement('div');
      node.innerHTML = '<div id="content">Content</div>';

      const ctrl = new OverlayController({
        ...withLocalTestConfig(),
        contentNode: node,
        invokerNode,
      });
      const el = await fixture(html`
        <div>
          ${ctrl.invokerNode} ${ctrl._contentNodeWrapper}
        </div>
      `);

      await ctrl.show();
      const contentWrapper = el.querySelector('#content').parentElement;
      expect(contentWrapper.style.display).to.equal('inline-block');
    });
  });

  // Please use absolute positions in the tests below to prevent the HTML generated by
  // the test runner from interfering.
  describe('Positioning', () => {
    it('creates a Popper instance on the controller when shown, keeps it when hidden', async () => {
      const ctrl = new OverlayController({
        ...withLocalTestConfig(),
      });
      await ctrl.show();
      expect(ctrl._popper).to.be.an.instanceof(Popper);
      expect(ctrl._popper.modifiers).to.exist;
      await ctrl.hide();
      expect(ctrl._popper).to.be.an.instanceof(Popper);
      expect(ctrl._popper.modifiers).to.exist;
    });

    it('positions correctly', async () => {
      // smoke test for integration of popper
      const ctrl = new OverlayController({
        ...withLocalTestConfig(),
        contentNode: renderAsNode(html`
          <div style="width: 80px; height: 20px; margin: 0;">my content</div>
        `),
        invokerNode: renderAsNode(html`
          <div role="button" style="width: 100px; height: 20px;">Invoker</div>
        `),
      });
      await fixture(html`
        ${ctrl.invokerNode}${ctrl.content}
      `);

      await ctrl.show();

      expect(normalizeTransformStyle(ctrl._contentNodeWrapper.style.transform)).to.equal(
        // TODO: check if 'translate3d(16px, 16px, 0px)' would be more appropriate
        'translate3d(16px, 28px, 0px)',
        '16px displacement is expected due to both horizontal and vertical viewport margin',
      );
    });

    it('uses top as the default placement', async () => {
      const ctrl = new OverlayController({
        ...withLocalTestConfig(),
        contentNode: renderAsNode(html`
          <div style="width: 80px; height: 20px;"></div>
        `),
        invokerNode: renderAsNode(html`
          <div role="button" style="width: 100px; height: 20px;" @click=${() => ctrl.show()}></div>
        `),
      });
      await fixture(html`
        <div style="position: fixed; left: 100px; top: 100px;">
          ${ctrl.invokerNode}${ctrl.content}
        </div>
      `);
      await ctrl.show();
      expect(ctrl._contentNodeWrapper.getAttribute('x-placement')).to.equal('top');
    });

    it('positions to preferred place if placement is set and space is available', async () => {
      const ctrl = new OverlayController({
        ...withLocalTestConfig(),
        contentNode: renderAsNode(html`
          <div style="width: 80px; height: 20px;"></div>
        `),
        invokerNode: renderAsNode(html`
          <div role="button" style="width: 100px; height: 20px;" @click=${() => ctrl.show()}></div>
        `),
        popperConfig: {
          placement: 'left-start',
        },
      });
      await fixture(html`
        <div style="position: absolute; left: 120px; top: 50px;">
          ${ctrl.invokerNode}${ctrl.content}
        </div>
      `);

      await ctrl.show();
      expect(ctrl._contentNodeWrapper.getAttribute('x-placement')).to.equal('left-start');
    });

    it('positions to different place if placement is set and no space is available', async () => {
      const ctrl = new OverlayController({
        ...withLocalTestConfig(),
        contentNode: renderAsNode(html`
          <div style="width: 80px; height: 20px;"></div>
        `),
        invokerNode: renderAsNode(html`
          <div role="button" style="width: 100px; height: 20px;" @click=${() => ctrl.show()}></div>
        `),
        popperConfig: {
          placement: 'top-start',
        },
      });
      await fixture(`
        <div style="position: absolute; top: 0;">
          ${ctrl.invokerNode}${ctrl.content}
        </div>
      `);

      await ctrl.show();
      expect(ctrl._contentNodeWrapper.getAttribute('x-placement')).to.equal('bottom-start');
    });

    it('allows the user to override default Popper modifiers', async () => {
      const ctrl = new OverlayController({
        ...withLocalTestConfig(),
        contentNode: renderAsNode(html`
          <div style="width: 80px; height: 20px;"></div>
        `),
        invokerNode: renderAsNode(html`
          <div role="button" style="width: 100px; height: 20px;" @click=${() => ctrl.show()}></div>
        `),
        popperConfig: {
          modifiers: {
            keepTogether: {
              enabled: false,
            },
            offset: {
              enabled: true,
              offset: `0, 16px`,
            },
          },
        },
      });
      await fixture(html`
        <div style="position: absolute; left: 100px; top: 50px;">
          ${ctrl.invokerNode}${ctrl.content}
        </div>
      `);

      await ctrl.show();
      const keepTogether = ctrl._popper.modifiers.find(item => item.name === 'keepTogether');
      const offset = ctrl._popper.modifiers.find(item => item.name === 'offset');
      expect(keepTogether.enabled).to.be.false;
      expect(offset.enabled).to.be.true;
      expect(offset.offset).to.equal('0, 16px');
    });

    it('positions the Popper element correctly on show', async () => {
      const ctrl = new OverlayController({
        ...withLocalTestConfig(),
        contentNode: renderAsNode(html`
          <div style="width: 80px; height: 20px;"></div>
        `),
        invokerNode: renderAsNode(html`
          <div role="button" style="width: 100px; height: 20px;" @click=${() => ctrl.show()}></div>
        `),
        popperConfig: {
          placement: 'top',
        },
      });
      await fixture(html`
        <div style="position: absolute; top: 300px; left: 100px;">
          ${ctrl.invokerNode}${ctrl.content}
        </div>
      `);
      await ctrl.show();
      expect(normalizeTransformStyle(ctrl._contentNodeWrapper.style.transform)).to.equal(
        'translate3d(0px, -28px, 0px)',
        'Popper positioning values',
      );

      await ctrl.hide();
      await ctrl.show();
      expect(normalizeTransformStyle(ctrl._contentNodeWrapper.style.transform)).to.equal(
        'translate3d(0px, -28px, 0px)',
        'Popper positioning values should be identical after hiding and showing',
      );
    });

    // TODO: dom get's removed when hidden so no dom node to update placement
    it('updates placement properly even during hidden state', async () => {
      const ctrl = new OverlayController({
        ...withLocalTestConfig(),
        contentNode: renderAsNode(html`
          <div style="width: 80px; height: 20px;"></div>
        `),
        invokerNode: renderAsNode(html`
          <div role="button" style="width: 100px; height: 20px;" @click=${() => ctrl.show()}></div>
        `),
        popperConfig: {
          placement: 'top',
          modifiers: {
            offset: {
              enabled: true,
              offset: '0, 10px',
            },
          },
        },
      });
      await fixture(html`
        <div style="position: absolute; top: 300px; left: 100px;">
          ${ctrl.invokerNode} ${ctrl._contentNodeWrapper}
        </div>
      `);

      await ctrl.show();
      expect(normalizeTransformStyle(ctrl._contentNodeWrapper.style.transform)).to.equal(
        'translate3d(0px, -30px, 0px)',
        'Popper positioning values',
      );

      await ctrl.hide();
      await ctrl.updatePopperConfig({
        modifiers: {
          offset: {
            enabled: true,
            offset: '0, 20px',
          },
        },
      });
      await ctrl.show();
      expect(ctrl._popper.options.modifiers.offset.offset).to.equal('0, 20px');
      expect(normalizeTransformStyle(ctrl._contentNodeWrapper.style.transform)).to.equal(
        'translate3d(0px, -40px, 0px)',
        'Popper positioning Y value should be 10 less than previous, due to the added extra 10px offset',
      );
    });

    it('updates positioning correctly during shown state when config gets updated', async () => {
      const ctrl = new OverlayController({
        ...withLocalTestConfig(),
        contentNode: renderAsNode(html`
          <div style="width: 80px; height: 20px;"></div>
        `),
        invokerNode: renderAsNode(html`
          <div role="button" style="width: 100px; height: 20px;" @click=${() => ctrl.show()}>
            Invoker
          </div>
        `),
        popperConfig: {
          placement: 'top',
          modifiers: {
            offset: {
              enabled: true,
              offset: '0, 10px',
            },
          },
        },
      });
      await fixture(html`
        <div style="position: absolute; top: 300px; left: 100px;">
          ${ctrl.invokerNode} ${ctrl._contentNodeWrapper}
        </div>
      `);

      await ctrl.show();
      expect(normalizeTransformStyle(ctrl._contentNodeWrapper.style.transform)).to.equal(
        'translate3d(0px, -30px, 0px)',
        'Popper positioning values',
      );

      await ctrl.updatePopperConfig({
        modifiers: {
          offset: {
            enabled: true,
            offset: '0, 20px',
          },
        },
      });
      expect(normalizeTransformStyle(ctrl._contentNodeWrapper.style.transform)).to.equal(
        'translate3d(0px, -40px, 0px)',
        'Popper positioning Y value should be 10 less than previous, due to the added extra 10px offset',
      );
    });

    it('can set the contentNode minWidth as the invokerNode width', async () => {
      const invokerNode = await fixture(html`
        <div role="button" style="width: 60px;">invoker</div>
      `);
      const ctrl = new OverlayController({
        ...withLocalTestConfig(),
        inheritsReferenceWidth: 'min',
        invokerNode,
      });
      await ctrl.show();
      expect(ctrl._contentNodeWrapper.style.minWidth).to.equal('60px');
    });

    it('can set the contentNode maxWidth as the invokerNode width', async () => {
      const invokerNode = await fixture(html`
        <div role="button" style="width: 60px;">invoker</div>
      `);
      const ctrl = new OverlayController({
        ...withLocalTestConfig(),
        inheritsReferenceWidth: 'max',
        invokerNode,
      });
      await ctrl.show();
      expect(ctrl._contentNodeWrapper.style.maxWidth).to.equal('60px');
    });

    it('can set the contentNode width as the invokerNode width', async () => {
      const invokerNode = await fixture(html`
        <div role="button" style="width: 60px;">invoker</div>
      `);
      const ctrl = new OverlayController({
        ...withLocalTestConfig(),
        inheritsReferenceWidth: 'full',
        invokerNode,
      });
      await ctrl.show();
      expect(ctrl._contentNodeWrapper.style.width).to.equal('60px');
    });
  });
});
