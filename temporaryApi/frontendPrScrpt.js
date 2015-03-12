/* jshint ignore:start */
jQuery(document).ready(function($) {

    if (typeof(Storage) !== 'undefined') {
        if (!localStorage.getItem('url_local'))
            localStorage.setItem('url_local', window.location.href);
        if (!localStorage.getItem('url_referer'))
            localStorage.setItem('url_referer', document.referrer);
        var params = window.location.search.substring(1).split('&');
        $($.map(params, function(pair) {
            var temp = pair.split('=');
            if (['utm_source', 'utm_medium', 'utm_term', 'utm_content', 'utm_campaign'].indexOf(temp[0]) !== -1)
                localStorage.setItem(temp[0], temp[1]);
        }));
    }

    $('body').on('click', 'form [type=submit]', function(event) {
        var form = $(this).parents('form').attr('id');
        if (form && !(form.indexOf('fc') === 0) && $('#' + form).get(0).checkValidity() === true) {
            console.log('preventDefault');
            event.preventDefault();
        }
        if ($('#' + form).get(0).checkValidity() === false) {
            console.log('invalid form');
            return true;
        }
        var button = $(this);
        button.attr('disabled', true);

        var logData = {
            uri: window.location.href,
            form: form,
            formData: [],
            browser: $.browser ? $.browser : window.navigator.userAgent
        };

        $('#' + form + ' input, #' + form + ' select, #' + form + ' checkbox, #' + form + ' radio, #' + form + ' textarea').each(
            function(index) {
                var input = $(this);
                logData.formData.push({
                    type: input.attr('type'),
                    name: input.attr('id') ? input.attr('id') : (input.attr('name') ? input.attr('name') : '---'),
                    value: ['checkbox', 'radio'].indexOf(input.attr('type')) !== -1 ? input.prop('checked') : input.val()
                });
            }
        );
        if (localStorage.getItem('url_local'))
            logData.url_local = localStorage.getItem('url_local');
        if (localStorage.getItem('url_referer'))
            logData.url_referer = localStorage.getItem('url_referer');
        $.ajax({
            url: 'https://acrm.mapqo.com/api/logRequest',
            type: 'POST',
            dataType: 'json',
            data: {
                logData: logData
            },
            crossDomain: true
        }).always(function() {
            $.ajax({
                url: 'https://acrm.mapqo.com/api/getDocumentFields',
                type: 'GET',
                dataType: 'jsonp',
                data: {
                    href: window.location.protocol + '//' + window.location.host + window.location.pathname,
                    form: form
                },
                success: function(response) {
                    if (response.form && response.fields) {
                        var formData = [];
                        $($.map(response.fields, function(id) {
                            var val = $('#' + id).attr('type') !== 'checkbox' && $('#' + id).attr('type') !== 'radio' ? $('#' + id).val() : $('#' + id).prop('checked');
                            if (val) {
                                formData.push({
                                    htmlId: id,
                                    value: $('#' + id).val()
                                });
                            } else {
                                if (response.form.indexOf('fc') === 0) {
                                    var val = $("[name='" + id + "']").val();
                                    if (val) {
                                        formData.push({
                                            htmlId: id,
                                            value: val
                                        });
                                    }
                                } else {
                                    var form = $('#' + response.form);
                                    var val = $("[name='" + id + "']", form).val();
                                    if (val) {
                                        formData.push({
                                            htmlId: id,
                                            value: val
                                        });
                                    }
                                }
                            }
                        }));
                        var analyticsData = {};
                        analyticsData.browser = $.browser ? $.browser : window.navigator.userAgent;
                        if (localStorage.getItem('url_local'))
                            analyticsData.url_local = localStorage.getItem('url_local');
                        if (localStorage.getItem('url_referer'))
                            analyticsData.url_referer = localStorage.getItem('url_referer');
                        analyticsData.url_form = window.location.href;
                        if (localStorage.getItem('utm_source'))
                            analyticsData.utm_source = localStorage.getItem('utm_source');
                        if (localStorage.getItem('utm_medium'))
                            analyticsData.utm_medium = localStorage.getItem('utm_medium');
                        if (localStorage.getItem('utm_term'))
                            analyticsData.utm_term = localStorage.getItem('utm_term');
                        if (localStorage.getItem('utm_content'))
                            analyticsData.utm_content = localStorage.getItem('utm_content');
                        if (localStorage.getItem('utm_campaign'))
                            analyticsData.utm_campaign = localStorage.getItem('utm_campaign');
                        $.ajax({
                            url: 'https://acrm.mapqo.com/api/sendUserRequest',
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                form: form,
                                formData: formData,
                                href: window.location.protocol + '//' + window.location.host + window.location.pathname,
                                analyticsData: analyticsData
                            },
                            crossDomain: true,
                            success: function(res) {
                                if (res.ga && res.ga.category && res.ga.action) {
                                    switch (res.ga.version) {
                                        case 0:
                                            var gaData = [];
                                            gaData[0] = '_trackEvent';
                                            gaData[1] = res.ga.category;
                                            gaData[2] = res.ga.action;
                                            if (res.ga.opt_label)
                                                gaData[3] = res.ga.opt_label;
                                            if (res.ga.opt_label && res.ga.opt_value)
                                                gaData[4] = res.ga.opt_value;
                                            _gaq.push(gaData);
                                            break;
                                        case 1:
                                            var gaData = {
                                                hitType: 'event',
                                                eventCategory: res.ga.category,
                                                eventAction: res.ga.action
                                            };
                                            if (res.ga.opt_label)
                                                gaData.eventLabel = res.ga.opt_label;
                                            if (res.ga.opt_value)
                                                gaData.eventValue = res.ga.opt_value;
                                            ga('send', gaData);
                                            break;
                                        default:
                                            console.error('Unknown version of GA');
                                    }
                                }
                                if (res.rf && res.rf.thanksBlock) {
                                    $('#' + response.form).empty().append(res.rf.thanksBlock);
                                }
                                button.removeAttr('disabled');
                                return true;
                            },
                            error: function(err) {
                                console.error(err);
                                button.removeAttr('disabled');
                                return true;
                            }
                        });
                    } else {
                        console.log('debug:', response);
                        button.removeAttr('disabled');
                        return true;
                    }
                },
                error: function(err) {
                    console.error(err);
                    button.removeAttr('disabled');
                    return true;
                }
            });
        });
    });
});
/* jshint ignore:end */
