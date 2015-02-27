/* jshint ignore:start */
jQuery(document).ready(function($) {

    if (!$.sessionStorage('url_local'))
        $.sessionStorage('url_local', window.location.href);
    if (!$.sessionStorage('url_referer'))
        $.sessionStorage('url_referer', document.referrer);
    var params = window.location.search.substring(1).split('&');
    $($.map(params, function(pair) {
        var temp = pair.split('=');
        if (['utm_source', 'utm_medium', 'utm_term', 'utm_content', 'utm_campaign'].indexOf(temp[0]) !== -1) {
            $.sessionStorage(temp[0], temp[1]);
        }
    }));

    $('body').on('click', 'form [type=submit]', function() {
        var form = $(this).parents('form').attr('id');
        $.ajax({
            url: 'http://dev.mapqo.com/api/getDocumentFields',
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
                        var val = $('#' + id).attr('type') !== 'checkbox' ? $('#' + id).val() : $('#' + id).prop('checked');
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
                    $.ajax({
                        url: 'http://api.hostip.info/get_html.php',
                        type: 'GET',
                        success: function(res) {
                            var temp = res.split(':');
                            analyticsData.ip = temp[temp.length - 1].trim();
                        },
                        error: function(err) {
                            console.error('err');
                        }
                    }).always(function() {
                        if ($.sessionStorage('url_local'))
                            analyticsData.url_local = $.sessionStorage('url_local');
                        if ($.sessionStorage('url_referer'))
                            analyticsData.url_referer = $.sessionStorage('url_referer');
                        analyticsData.url_form = window.location.href;
                        if ($.sessionStorage('utm_source'))
                            analyticsData.utm_source = $.sessionStorage('utm_source');
                        if ($.sessionStorage('utm_medium'))
                            analyticsData.utm_medium = $.sessionStorage('utm_medium');
                        if ($.sessionStorage('utm_term'))
                            analyticsData.utm_term = $.sessionStorage('utm_term');
                        if ($.sessionStorage('utm_content'))
                            analyticsData.utm_content = $.sessionStorage('utm_content');
                        if ($.sessionStorage('utm_campaign'))
                            analyticsData.utm_campaign = $.sessionStorage('utm_campaign');
                        $.ajax({
                            url: 'http://dev.mapqo.com/api/sendUserRequest',
                            type: 'POST',
                            dataType: 'json',
                            data: {
                                formData: formData,
                                href: window.location.protocol + '//' + window.location.host + window.location.pathname,
                                analyticsData: analyticsData
                            },
                            crossDomain: true,
                            success: function(res) {
                                if (res.ga && res.ga.category && res.ga.action) {
                                    switch (res.ga.version) {
                                        case 0:
                                            _gaq.push(['_trackEvent', res.ga.category, res.ga.action, res.ga.opt_label ? res.ga.opt_label : null, res.ga.opt_value ? res.ga.opt_value : null]);
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
                            },
                            error: function(err) {
                                console.log(err);
                            }
                        });
                    });
                } else {
                    console.log('debug:', response);
                }
            }
        });
        return false;
    });
});
/* jshint ignore:end */
